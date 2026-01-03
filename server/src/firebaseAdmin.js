import admin from "firebase-admin";

function loadServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT env var");

  const json = JSON.parse(raw);

  if (json.private_key) {
    json.private_key = json.private_key.replace(/\\n/g, "\n");
  }

  return json;
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(loadServiceAccount()),
  });
}

export const dbAdmin = admin.firestore();
export const authAdmin = admin.auth();
