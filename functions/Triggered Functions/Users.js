import { initializeApp } from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v1/https";
import { error, log, warn } from "firebase-functions/logger";
import { doc, setDoc } from "firebase/firestore";
import {
  FIREBASE_SERVER_REGION,
  DEFAULT_CLOUD_ACCOUNTS,
  DEFAULT_MARKET_OPTION,
  DEFAULT_ORDER_OPTION,
  DEFAULT_ASSET_LOCATION,
  DEFAULT_CITADEL_BROKERS_FEE,
  DEFAULT_MANUFACTURING_STRUCTURES,
  DEFAULT_REACTION_STRUCTURES,
} from "../global-config-functions";

const app = initializeApp();
const db = getFirestore(app);

const createUserData = onCall(
  {
    region: FIREBASE_SERVER_REGION,
  },
  (data, context) => {
    if (!context.app) {
      warn("Unverified function Call");
      warn(context);
      throw new HttpsError(
        "Unable to verify",
        "The function must be called from a verified app."
      );
    }
    try {
      const setupData = {
        accountID: context.auth.uid,
        jobStatusArray: [
          {
            id: 0,
            name: "Planning",
            sortOrder: 0,
            expanded: true,
            openAPIJobs: false,
            completeAPIJobs: false,
          },
          {
            id: 1,
            name: "Purchasing",
            sortOrder: 1,
            expanded: true,
            openAPIJobs: false,
            completeAPIJobs: false,
          },
          {
            id: 2,
            name: "Building",
            sortOrder: 2,
            expanded: true,
            openAPIJobs: true,
            completeAPIJobs: false,
          },
          {
            id: 3,
            name: "Complete",
            sortOrder: 3,
            expanded: true,
            openAPIJobs: false,
            completeAPIJobs: true,
          },
          {
            id: 4,
            name: "For Sale",
            sortOrder: 4,
            expanded: true,
            openAPIJobs: false,
            completeAPIJobs: false,
          },
        ],
        deleted: null,
        linkedJobs: [],
        linkedTrans: [],
        linkedOrders: [],
        settings: {
          account: {
            cloudAccounts: DEFAULT_CLOUD_ACCOUNTS || false,
          },
          layout: {
            hideTutorials: false,
            localMarketDisplay: null,
            localOrderDisplay: null,
            esiJobTab: null,
          },
          editJob: {
            defaultMarket: DEFAULT_MARKET_OPTION || "jita",
            defaultOrders: DEFAULT_ORDER_OPTION || "sell",
            hideCompleteMaterials: false,
            defaultAssetLocation: DEFAULT_ASSET_LOCATION || 60003760,
            citadelBrokersFee: DEFAULT_CITADEL_BROKERS_FEE || 1,
          },
          structures: {
            manufacturing: DEFAULT_MANUFACTURING_STRUCTURES || [],
            reaction: DEFAULT_REACTION_STRUCTURES || [],
          },
        },
        refreshTokens: [],
      };

      setDoc(doc(db, "Users", context.auth.uid), setupData);

      setDoc(doc(db`Users/${context.auth.uid}/ProfileInfo/Watchlist`), {
        groups: [],
        items: [],
      });

      setDoc(doc(db, `Users/${context.auth.uid}/ProfileInfo/JobSnapshot`), {
        snapshot: [],
      });
      setDoc(doc(db`Users/${context.auth.uid}/ProfileInfo/GroupData`), {
        groupData: [],
      });
      log(`Account ${context.auth.uid} document created successfully`);
      return setupData;
    } catch (err) {
      error(`Error When Creating User Account ${context.auth.uid}`);
      error(err);
      throw new HttpsError("Unable to setup account, please try again");
    }
  }
);

export default createUserData;
