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
  signIn: () => Promise<void>
  signOutUser: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  isPro: false,
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
      return
    }
    let cancelled = false
    let unsub: (() => void) | undefined
    ;(async () => {
      const { getDb } = await import('@/lib/firebase')
      const { doc, onSnapshot, setDoc, serverTimestamp } = await import('firebase/firestore')
      if (cancelled) return
      const ref = doc(getDb(), 'users', user.uid)
      // Make sure a user document exists for the admin to flip isPro on.
      setDoc(
        ref,
        {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      ).catch((err) => console.log('[user doc write failed]', err))

      unsub = onSnapshot(
        ref,
        (snap) => setIsPro(snap.data()?.isPro === true),
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
    () => ({ user, loading, isPro, signIn, signOutUser }),
    [user, loading, isPro, signIn, signOutUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
