import { onRequest } from "firebase-functions/v1/https";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import {
  DEFAULT_API_MAX_SERVER_INSTANCES,
  FIREBASE_SERVER_REGION,
} from "../global-config-functions.js";
import verifyEveToken from "../Middleware/eveTokenVerify.js";
import generateFirebaseToken from "./endpoints-v1/generateToken.js";
import retrieveItemRecipe from "./endpoints-v1/retrieveItemRecipe.js";
import retrieveMultipleItemRecipies from "./endpoints-v1/retrieveMultipleItemRecipies.js";
import marketData from "./endpoints-v1/marketData.js";
import retrieveSystemIndex from "./endpoints-v1/singleSystemIndex.js";
import retrieveMultipleSystemIndexes from "./endpoints-v1/multipleSystemIndexes.js";
import appCheckVerification from "../Middleware/AppCheck.js";
import checkVersion from "../Middleware/appVersion.js";
import { initializeApp } from "firebase-admin/app";

const expressApp = express();

initializeApp();

// expressApp.use(
//   cors({
//     origin: [
//       "http://localhost:3000",
//       "https://eve-industry-planner-dev.firebaseapp.com",
//       "https://eve-industry-planner-dev.cloudfunctions.net",
//       "https://www.eveindustryplanner.com",
//       "https://eveindustryplanner.com",
//     ],
//     methods: "GET,POST",
//     preflightContinue: false,
//     optionsSuccessStatus: 204,
//   })
// );
expressApp.use(express.json());
expressApp.use(helmet());
expressApp.use(appCheckVerification);
expressApp.use(checkVersion);

expressApp.post("/auth/generate-token", verifyEveToken, (req, res) =>
  generateFirebaseToken(req, res)
);
expressApp.get("/item/:itemID", (req, res) => retrieveItemRecipe(req, res));
expressApp.post("/item", (req, res) => retrieveMultipleItemRecipies(req, res));
expressApp.post("/market-data", (req, res) => marketData(req, res));
expressApp.get("/system-indexes/:systemID", (req, res) =>
  retrieveSystemIndex(req, res)
);
expressApp.post("/system-indexes", (req, res) =>
  retrieveMultipleSystemIndexes(req, res)
);

const v1 = onRequest(
  {
    region: FIREBASE_SERVER_REGION,
    maxInstaces: DEFAULT_API_MAX_SERVER_INSTANCES,
  },
  expressApp
);

export default v1;
