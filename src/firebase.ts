import { initializeApp } from "firebase/app";
import { initializeFirestore, enableMultiTabIndexedDbPersistence } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom databaseId and enable forced long-polling
// to prevent connection issues inside sandboxed iframe environments or proxies
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

// Enable offline persistence for seamless multi-tab offline support
try {
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    console.warn("Firestore persistence failed to enable:", err.code);
  });
} catch (e) {
  console.warn("Firestore persistence is not supported in this environment:", e);
}

