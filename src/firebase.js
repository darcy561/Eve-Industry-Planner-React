import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from "firebase/app-check";
import { getPerformance } from "firebase/performance";
import { getFunctions } from "firebase/functions";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_fbApiKey,
  authDomain: process.env.REACT_APP_fbAuthDomain,
  databaseURL: process.env.REACT_APP_fbDatabaseURL,
  projectId: process.env.REACT_APP_fbProjectID,
  storageBucket: process.env.REACT_APP_fbStorageBucket,
  messagingSenderId: process.env.REACT_APP_fbMessagingSenderID,
  appId: process.env.REACT_APP_fbAppID,
  measurementId: process.env.REACT_APP_measurmentID
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const firestore = getFirestore(app);
export const functions = getFunctions(app, "europe-west1");
export const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider(
    process.env.REACT_APP_ReCaptchaKey
  ),
  isTokenAutoRefreshEnabled: true,
});

export const performance = getPerformance(app);
export const analytics = getAnalytics(app);

export default app;
