import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

type ServiceAccount = {
  project_id: string;
  private_key: string;
  client_email: string;
};

let initialized = false;

function parseServiceAccount(): ServiceAccount {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON");
  }

  const parsed = JSON.parse(raw) as Partial<ServiceAccount>;
  if (!parsed.project_id || !parsed.private_key || !parsed.client_email) {
    throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_JSON");
  }

  const privateKey = parsed.private_key.includes("\\n")
    ? parsed.private_key.replace(/\\n/g, "\n")
    : parsed.private_key;

  return {
    project_id: parsed.project_id,
    private_key: privateKey,
    client_email: parsed.client_email,
  };
}

export function getFirebaseAdmin() {
  if (!initialized) {
    const serviceAccount = parseServiceAccount();
    if (getApps().length === 0) {
      initializeApp({
        credential: cert(serviceAccount as any),
      });
    }
    initialized = true;
  }

  // Keep compatibility with existing call sites: getFirebaseAdmin().auth().verifyIdToken(...)
  return {
    auth: () => getAuth(),
  } as any;
}
