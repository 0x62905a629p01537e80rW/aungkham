import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { User } from 'firebase/auth'

type AuthState = {
  user: User | null
  loading: boolean
  isPro: boolean
  /** true when a submitted payment is awaiting manual approval */
  proPending: boolean
  /** null = lifetime / no expiry set */
  proExpiresAt: Date | null
  proSince: Date | null
  signIn: () => Promise<void>
  signOutUser: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  isPro: false,
  proPending: false,
  proExpiresAt: null,
  proSince: null,
  signIn: async () => {},
  signOutUser: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPro, setIsPro] = useState(false)
  const [proPending, setProPending] = useState(false)
  const [proExpiresAt, setProExpiresAt] = useState<Date | null>(null)
  const [proSince, setProSince] = useState<Date | null>(null)

  // Auth session
  useEffect(() => {
    let cancelled = false
    let unsub: (() => void) | undefined
    // The auth SDK can silently hang inside the native WebView (no
    // onAuthStateChanged event). Never leave the app stuck on "loading…".
    const bail = setTimeout(() => {
      if (!cancelled) setLoading(false)
    }, 9000)
    ;(async () => {
      const { getFirebaseAuth } = await import('@/lib/firebase')
      const { isNative } = await import('@/lib/native')
      const { onAuthStateChanged } = await import('firebase/auth')
      if (isNative()) {
        try {
          const { setPersistence, browserLocalPersistence, indexedDBLocalPersistence } =
            await import('firebase/auth')
          const p = typeof indexedDB === 'undefined' ? browserLocalPersistence : indexedDBLocalPersistence
          await setPersistence(getFirebaseAuth(), p)
        } catch {
          /* non-fatal */
        }
      }
      if (cancelled) return
      unsub = onAuthStateChanged(getFirebaseAuth(), (u) => {
        setUser(u)
        setLoading(false)
      })
    })().catch((err) => {
      console.log('[auth init failed]', err)
      setLoading(false)
    })
    return () => {
      cancelled = true
      clearTimeout(bail)
      unsub?.()
    }
  }, [])

  // Real-time Pro unlock: users/{uid}.isPro
  useEffect(() => {
    if (!user) {
      setIsPro(false)
      setProPending(false)
      setProExpiresAt(null)
      setProSince(null)
      return
    }
    let cancelled = false
    let unsub: (() => void) | undefined
    ;(async () => {
      const { getDb } = await import('@/lib/firebase')
      const { doc, getDoc, onSnapshot, setDoc, serverTimestamp } = await import('firebase/firestore')
      if (cancelled) return
      const ref = doc(getDb(), 'users', user.uid)

      // Ensure users/{uid} exists. Never overwrite an admin-set isPro flag.
      try {
        const snap = await getDoc(ref)
        if (!snap.exists()) {
          await setDoc(ref, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            isPro: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
        } else {
          await setDoc(
            ref,
            {
              email: user.email,
              displayName: user.displayName,
              updatedAt: serverTimestamp(),
            },
            { merge: true },
          )
        }
      } catch (err) {
        console.log('[user doc write failed]', err)
      }
      if (cancelled) return

      unsub = onSnapshot(
        ref,
        (snap) => {
          const d = snap.data()
          setIsPro(d?.isPro === true)
          const toDate = (v: unknown): Date | null => {
            if (!v) return null
            if (typeof v === 'object' && v !== null && 'toDate' in v) {
              try {
                return (v as { toDate: () => Date }).toDate()
              } catch {
                return null
              }
            }
            const parsed = new Date(v as string | number)
            return Number.isNaN(parsed.getTime()) ? null : parsed
          }
          setProExpiresAt(toDate(d?.proExpiresAt ?? d?.pro_expires_at))
          setProSince(toDate(d?.proSince ?? d?.pro_since ?? d?.updatedAt))
        },
        (err) => console.log('[pro listener failed]', err),
      )
    })().catch((err) => console.log('[pro listener init failed]', err))

    return () => {
      cancelled = true
      unsub?.()
    }
  }, [user])

  // Pending payment: any transactions doc for this user still `pending`
  useEffect(() => {
    if (!user) {
      setProPending(false)
      return
    }
    let cancelled = false
    let unsub: (() => void) | undefined
    ;(async () => {
      const { getDb } = await import('@/lib/firebase')
      const { collection, onSnapshot, query, where } = await import('firebase/firestore')
      if (cancelled) return
      const q = query(
        collection(getDb(), 'transactions'),
        where('userId', '==', user.uid),
        where('status', '==', 'pending'),
      )
      unsub = onSnapshot(
        q,
        (snap) => setProPending(!snap.empty),
        (err) => console.log('[pending listener failed]', err),
      )
    })().catch((err) => console.log('[pending listener init failed]', err))
    return () => {
      cancelled = true
      unsub?.()
    }
  }, [user])

  const signIn = useCallback(async () => {
    const { getFirebaseAuth } = await import('@/lib/firebase')
    const { isNative } = await import('@/lib/native')

    if (isNative()) {
      // Native Google sign-in (no popup / no browser redirect)
      const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication')
      const { GoogleAuthProvider, signInWithCredential, getRedirectResult } =
        await import('firebase/auth')
      const auth = getFirebaseAuth()

      const withTimeout = <T,>(p: Promise<T>, ms: number, label: string) =>
        new Promise<T>((resolve, reject) => {
          const t = setTimeout(
            () => reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s`)),
            ms,
          )
          p.then((v) => {
            clearTimeout(t)
            resolve(v)
          }).catch((e) => {
            clearTimeout(t)
            reject(e)
          })
        })

      const describe = (e: unknown) => {
        const err = e as { message?: string; code?: string; errorMessage?: string } | undefined
        const raw = err?.errorMessage || err?.message || String(e)
        if (/cancel|closed|dismiss|12501/i.test(raw)) return 'Sign-in cancelled'
        if (/10:|DEVELOPER_ERROR|ApiException: 10/i.test(raw))
          return 'Google sign-in config error (code 10): the app fingerprint (SHA-1) is not registered in Firebase.'
        if (/7:|network|NETWORK_ERROR/i.test(raw)) return 'Network error — check your connection.'
        if (/no credential|NoCredentialException|16:/i.test(raw))
          return 'No Google account available on this device. Add a Google account in Android settings and try again.'
        return raw
      }

      // The newer Credential Manager flow silently hangs on many devices /
      // WebViews. Use the classic Google account picker first, then fall back.
      let result: Awaited<ReturnType<typeof FirebaseAuthentication.signInWithGoogle>> | undefined
      let firstError: unknown
      try {
        result = await withTimeout(
          FirebaseAuthentication.signInWithGoogle({ useCredentialManager: false }),
          40000,
          'Google sign-in',
        )
      } catch (err) {
        firstError = err
        const msg = describe(err)
        if (msg === 'Sign-in cancelled') throw new Error(msg)
        try {
          result = await withTimeout(
            FirebaseAuthentication.signInWithGoogle({ useCredentialManager: true }),
            40000,
            'Google sign-in (fallback)',
          )
        } catch (err2) {
          if (auth.currentUser) return
          try {
            await getRedirectResult(auth)
            if (auth.currentUser) return
          } catch {
            /* ignore */
          }
          console.log('[google sign-in failed]', firstError, err2)
          throw new Error(describe(err2))
        }
      }

      try {
        const idToken = result?.credential?.idToken
        const accessToken = result?.credential?.accessToken
        if (!idToken) {
          if (auth.currentUser) return
          throw new Error('Google sign-in returned no ID token')
        }
        const credential = GoogleAuthProvider.credential(idToken, accessToken ?? undefined)
        await withTimeout(signInWithCredential(auth, credential), 30000, 'Firebase sign-in')
      } catch (err) {
        // Sometimes the plugin signs the user in natively but the credential
        // exchange above fails. If there is already a signed-in session, treat
        // it as success rather than leaving the user stuck at "loading…".
        if (auth.currentUser) return
        try {
          await getRedirectResult(auth)
          if (auth.currentUser) return
        } catch {
          /* fall through to the original error */
        }
        console.log('[firebase credential exchange failed]', err)
        throw new Error(describe(err))
      }
      return
    }

    const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth')
    await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider())
  }, [])


  const signOutUser = useCallback(async () => {
    const { getFirebaseAuth } = await import('@/lib/firebase')
    const { isNative } = await import('@/lib/native')
    const { signOut } = await import('firebase/auth')
    if (isNative()) {
      try {
        const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication')
        await FirebaseAuthentication.signOut()
      } catch {
        /* ignore */
      }
    }
    await signOut(getFirebaseAuth())
  }, [])


  const value = useMemo(
    () => ({ user, loading, isPro, proPending, proExpiresAt, proSince, signIn, signOutUser }),
    [user, loading, isPro, proPending, proExpiresAt, proSince, signIn, signOutUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
