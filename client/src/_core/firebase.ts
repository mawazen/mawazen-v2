// Firebase client configuration
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Direct Firebase configuration
const resolvedAuthDomain =
  typeof window !== "undefined" &&
  (window.location.hostname === "mawazenco.com" ||
    window.location.hostname === "www.mawazenco.com" ||
    window.location.hostname.endsWith(".mawazenco.com"))
    ? "auth.mawazenco.com"
    : "mawzenco.firebaseapp.com";

const firebaseConfig = {
  apiKey: "AIzaSyDZkfzWCQSg4XFbwCQv29HvDI4vIxBw7lA",
  authDomain: resolvedAuthDomain,
  projectId: "mawzenco",
  storageBucket: "mawzenco.firebasestorage.app",
  messagingSenderId: "888669754968",
  appId: "1:888669754968:web:e650b811ae28fc51e7dc2d",
  measurementId: "G-JHD98XMBN2",
};

let app: any = null;
let auth: any = null;

export async function getFirebaseApp() {
  if (!app) {
    app = initializeApp(firebaseConfig);
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