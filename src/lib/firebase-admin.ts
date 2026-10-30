import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

export function adminAuth() {
  if (!getApps().length) {
    const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
    // On Cloud Run without the secret, fall back to the runtime service account.
    initializeApp({ credential: sa ? cert(JSON.parse(sa)) : applicationDefault() });
  }
  return getAuth();
}
