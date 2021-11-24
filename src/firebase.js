import { initializeApp } from "firebase/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from "firebase/app-check";
import { getPerformance } from "firebase/performance";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_fbApiKey,
  authDomain: process.env.REACT_APP_fbAuthDomain,
  databaseURL: process.env.REACT_APP_fbDatabaseURL,
  projectId: process.env.REACT_APP_fbProjectID,
  storageBucket: process.env.REACT_APP_fbStorageBucket,
  messagingSenderId: process.env.REACT_APP_fbMessagingSenderID,
  appId: process.env.REACT_APP_fbAppID,
};

const firebase = initializeApp(firebaseConfig);

export const appCheck = initializeAppCheck(firebase, {
  provider: new ReCaptchaEnterpriseProvider(
    "6LfmUFcdAAAAAM-ArobT4itRSAhqMGTRWDjxGFCU"
  ),
  isTokenAutoRefreshEnabled: true,
});

export const performance = getPerformance(firebase);


export default firebase;