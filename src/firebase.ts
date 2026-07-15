import { initializeApp } from "firebase/app";
import { initializeFirestore, enableMultiTabIndexedDbPersistence } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom databaseId and enable auto-detect long-polling
// to prevent connection exhaustion while ensuring compatibility with proxies/webviews
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

// Enable offline persistence for seamless multi-tab offline support
try {
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    console.warn("Firestore persistence failed to enable:", err.code);
  });
} catch (e) {
  console.warn("Firestore persistence is not supported in this environment:", e);
}

