import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from "firebase/app-check";
import { getPerformance } from "firebase/performance";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";
import { getAnalytics } from "firebase/analytics";
import GLOBAL_CONFIG from "./global-config-app";

const { FIREBASE_FUNCTION_REGION } = GLOBAL_CONFIG;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_fbApiKey,
  authDomain: import.meta.env.VITE_fbAuthDomain,
  databaseURL: import.meta.env.VITE_fbDatabaseURL,
  projectId: import.meta.env.VITE_fbProjectID,
  storageBucket: import.meta.env.VITE_fbStorageBucket,
  messagingSenderId: import.meta.env.VITE_fbMessagingSenderID,
  appId: import.meta.env.VITE_fbAppID,
  measurementId: import.meta.env.VITE_measurmentID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const firestore = getFirestore(app);
export const functions = getFunctions(app, FIREBASE_FUNCTION_REGION);
export const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider(import.meta.env.VITE_ReCaptchaKey),
  isTokenAutoRefreshEnabled: true,
});

export const performance = getPerformance(app);
export const analytics = getAnalytics(app);

export default app;
