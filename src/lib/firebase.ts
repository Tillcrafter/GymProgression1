import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

// User's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD0OU0wrSGqyia5sKmmPdloMF1gK_GsOO8",
  authDomain: "gym-progression-79e69.firebaseapp.com",
  projectId: "gym-progression-79e69",
  storageBucket: "gym-progression-79e69.firebasestorage.app",
  messagingSenderId: "401983049841",
  appId: "1:401983049841:web:066d3b46a53fac4a024bd0"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Attempt anonymous sign-in if rules require authentication
signInAnonymously(auth).catch(() => {
  // It's completely fine if anonymous auth is disabled; public rules will work directly
});

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
  };
  console.warn("Firestore status: ", errInfo);
}

// Quick connection test
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, "weeks", "test_connection"));
    return true;
  } catch (error) {
    console.warn("Firebase test:", error);
    return false;
  }
}
