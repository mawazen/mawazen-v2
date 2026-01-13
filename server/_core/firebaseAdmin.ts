import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

type ServiceAccount = {
  project_id: string;
  private_key: string;
  client_email: string;
};

let initialized = false;

function tryParseServiceAccountJson(raw: string): Partial<ServiceAccount> {
  return JSON.parse(raw) as Partial<ServiceAccount>;
}

function decodeBase64ToUtf8(raw: string): string {
  return Buffer.from(raw, "base64").toString("utf8");
}

function parseServiceAccount(): ServiceAccount {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const rawBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64;

  if (!rawJson && !rawBase64) {
    throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON");
  }

  let parsed: any = null;

  const candidates: string[] = [];
  if (typeof rawJson === "string" && rawJson.trim()) candidates.push(rawJson.trim());
  if (typeof rawBase64 === "string" && rawBase64.trim()) candidates.push(decodeBase64ToUtf8(rawBase64.trim()));

  for (const candidate of candidates) {
    try {
      parsed = tryParseServiceAccountJson(candidate);
      break;
    } catch {
      try {
        parsed = tryParseServiceAccountJson(decodeBase64ToUtf8(candidate));
        break;
      } catch {
        parsed = null;
      }
    }
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_JSON");
  }

  const projectId = typeof parsed.project_id === "string" ? parsed.project_id : typeof parsed.projectId === "string" ? parsed.projectId : "";
  const clientEmail =
    typeof parsed.client_email === "string" ? parsed.client_email : typeof parsed.clientEmail === "string" ? parsed.clientEmail : "";
  const rawPrivateKey =
    typeof parsed.private_key === "string" ? parsed.private_key : typeof parsed.privateKey === "string" ? parsed.privateKey : "";

  if (!projectId || !clientEmail || !rawPrivateKey) {
    throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_JSON");
  }

  const privateKey = rawPrivateKey.includes("\\n") ? rawPrivateKey.replace(/\\n/g, "\n") : rawPrivateKey;

  return {
    project_id: projectId,
    private_key: privateKey,
    client_email: clientEmail,
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
