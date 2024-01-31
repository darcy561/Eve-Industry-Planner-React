const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { GLOBAL_CONFIG } = require("../global-config-functions");

const {
  FIREBASE_SERVER_REGION,
  DEFAULT_CLOUD_ACCOUNTS,
  DEFAULT_MARKET_OPTION,
  DEFAULT_ORDER_OPTION,
  DEFAULT_ASSET_LOCATION,
  DEFAULT_CITADEL_BROKERS_FEE,
  DEFAULT_MANUFACTURING_STRUCTURES,
  DEFAULT_REACTION_STRUCTURES,
} = GLOBAL_CONFIG;

exports.createUserData = functions
  .region(FIREBASE_SERVER_REGION)
  .https.onCall((data, context) => {
    if (!context.app) {
      functions.logger.warn("Unverified function Call");
      functions.logger.warn(context);
      throw new functions.https.HttpsError(
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

      admin
        .firestore()
        .collection("Users")
        .doc(context.auth.uid)
        .set(setupData);
      admin
        .firestore()
        .doc(`Users/${context.auth.uid}/ProfileInfo/Watchlist`)
        .set({
          groups: [],
          items: [],
        });
      admin
        .firestore()
        .doc(`Users/${context.auth.uid}/ProfileInfo/JobSnapshot`)
        .set({
          snapshot: [],
        });
      admin
        .firestore()
        .doc(`Users/${context.auth.uid}/ProfileInfo/GroupData`)
        .set({
          groupData: [],
        });
      functions.logger.log(
        `Account ${context.auth.uid} document created successfully`
      );
      return setupData;
    } catch (err) {
      functions.logger.error(
        `Error When Creating User Account ${context.auth.uid}`
      );
      functions.logger.error(err);
      throw new functions.https.HttpsError(
        "Unable to setup account, please try again"
      );
    }
  });
