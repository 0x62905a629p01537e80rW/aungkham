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
      try {
        const result = await FirebaseAuthentication.signInWithGoogle()
        const idToken = result.credential?.idToken
        const accessToken = result.credential?.accessToken
        if (!idToken) throw new Error('Google sign-in returned no ID token')
        const credential = GoogleAuthProvider.credential(idToken, accessToken ?? undefined)
        await signInWithCredential(auth, credential)
      } catch (err) {
        // Sometimes the plugin signs the user in natively but the credential
        // exchange above fails. If there is already a signed-in session, treat
        // it as success rather than leaving the user stuck at "loading…".
        try {
          const u = auth.currentUser
          if (u) return
          await getRedirectResult(auth)
          if (auth.currentUser) return
        } catch {
          /* fall through to the original error */
        }
        throw err
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
