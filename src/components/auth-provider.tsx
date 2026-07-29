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
  const [proExpiresAt, setProExpiresAt] = useState<Date | null>(null)
  const [proSince, setProSince] = useState<Date | null>(null)

  // Auth session
  useEffect(() => {
    let cancelled = false
    let unsub: (() => void) | undefined
    ;(async () => {
      const { getFirebaseAuth } = await import('@/lib/firebase')
      const { onAuthStateChanged } = await import('firebase/auth')
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
      unsub?.()
    }
  }, [])

  // Real-time Pro unlock: users/{uid}.isPro
  useEffect(() => {
    if (!user) {
      setIsPro(false)
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

  const signIn = useCallback(async () => {
    const { getFirebaseAuth } = await import('@/lib/firebase')
    const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth')
    await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider())
  }, [])

  const signOutUser = useCallback(async () => {
    const { getFirebaseAuth } = await import('@/lib/firebase')
    const { signOut } = await import('firebase/auth')
    await signOut(getFirebaseAuth())
  }, [])

  const value = useMemo(
    () => ({ user, loading, isPro, proExpiresAt, proSince, signIn, signOutUser }),
    [user, loading, isPro, proExpiresAt, proSince, signIn, signOutUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
