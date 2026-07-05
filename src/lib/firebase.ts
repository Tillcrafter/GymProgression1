import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";

// User's manual Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD0OU0wrSGqyia5sKmmPdloMF1gK_GsOO8",
  authDomain: "gym-progression-79e69.firebaseapp.com",
  projectId: "gym-progression-79e69",
  storageBucket: "gym-progression-79e69.firebasestorage.app",
  messagingSenderId: "401983049841",
  appId: "1:401983049841:web:066d3b46a53fac4a024bd0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

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
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test
async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.error("Please check your Firebase configuration or connection.");
    }
  }
}
testConnection();
