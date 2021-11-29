import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from "firebase/app-check";
import { getPerformance } from "firebase/performance";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_fbApiKey,
  authDomain: process.env.REACT_APP_fbAuthDomain,
  databaseURL: process.env.REACT_APP_fbDatabaseURL,
  projectId: process.env.REACT_APP_fbProjectID,
  storageBucket: process.env.REACT_APP_fbStorageBucket,
  messagingSenderId: process.env.REACT_APP_fbMessagingSenderID,
  appId: process.env.REACT_APP_fbAppID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const firestore = getFirestore(app);
export const functions = getFunctions(app);
export const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider(
    "6LfmUFcdAAAAAM-ArobT4itRSAhqMGTRWDjxGFCU"
  ),
  isTokenAutoRefreshEnabled: true,
});

export const performance = getPerformance(app);

export default app;
