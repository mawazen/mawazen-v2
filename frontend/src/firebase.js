import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

let firebaseConfig = null;
let app = null;
let auth = null;

async function getFirebaseConfig() {
  if (!firebaseConfig) {
    const res = await fetch('/api/public/firebase-config');
    if (!res.ok) throw new Error('Failed to fetch Firebase config');
    firebaseConfig = await res.json();
  }
  return firebaseConfig;
}

export async function getFirebaseApp() {
  if (!app) {
    const config = await getFirebaseConfig();
    app = initializeApp(config);
  }
  return app;
}

export async function getFirebaseAuth() {
  if (!auth) {
    const firebaseApp = await getFirebaseApp();
    auth = getAuth(firebaseApp);
  }
  return auth;
}

export default app;
