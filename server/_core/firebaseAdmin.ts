import * as admin from "firebase-admin";

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
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
    initialized = true;
  }
  return admin;
}
