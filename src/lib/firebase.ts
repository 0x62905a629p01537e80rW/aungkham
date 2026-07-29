import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyBHkt7MX6ZI-6zBoEA6WHEFUtBMB36Npl0',
  authDomain: 'myan-photo-editor.firebaseapp.com',
  projectId: 'myan-photo-editor',
  storageBucket: 'myan-photo-editor.firebasestorage.app',
  messagingSenderId: '705215793532',
  appId: '1:705215793532:web:c253bdb44cd9b30e153cf9',
  measurementId: 'G-3T63NJYZ5T',
}

let app: FirebaseApp | null = null

/** Browser-only Firebase accessors — never call during SSR. */
export function getFirebaseApp(): FirebaseApp {
  if (!app) app = getApps()[0] ?? initializeApp(firebaseConfig)
  return app
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp())
}

export function getDb(): Firestore {
  return getFirestore(getFirebaseApp())
}
