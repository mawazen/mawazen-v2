import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBruN5zEgWK9I1YdDhJ-fHtrDl4iMTPTFg",
  authDomain: "mawazen-b6541.firebaseapp.com",
  projectId: "mawazen-b6541",
  storageBucket: "mawazen-b6541.firebasestorage.app",
  messagingSenderId: "370573201852",
  appId: "1:370573201852:web:eb5953ce0378b50ee39bb9",
  measurementId: "G-MPRKHJ017W",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export default app;
