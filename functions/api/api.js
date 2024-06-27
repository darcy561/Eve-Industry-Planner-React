import { onRequest } from "firebase-functions/v1/https";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import {
  DEFAULT_API_MAX_SERVER_INSTANCES,
  FIREBASE_SERVER_REGION,
} from "../global-config-functions";
import verifyEveToken from "../Middleware/eveTokenVerify";
import generateFirebaseToken from "./endpoints/generateToken";
import retrieveItemRecipe from "./endpoints/retrieveItemRecipe";
import retrieveMultipleItemRecipies from "./endpoints/retrieveMultipleItemRecipies";
import marketData from "./endpoints/marketData";
import retrieveSystemIndex from "./endpoints/singleSystemIndex";
import retrieveMultipleSystemIndexes from "./endpoints/multipleSystemIndexes";

const expressApp = express();

expressApp.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://eve-industry-planner-dev.firebaseapp.com",
      "https://www.eveindustryplanner.com",
      "https://eveindustryplanner.com",
    ],
    methods: "GET,POST",
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);
expressApp.use(express.json());
expressApp.use(helmet());
expressApp.use();
expressApp.use();

expressApp.post("/auth/generate-token", verifyEveToken, (req, res) =>
  generateFirebaseToken(req, res)
);
expressApp.get("/item/:itemID", (req, res) => retrieveItemRecipe(req, res));
expressApp.post("/item", (req, res) => retrieveMultipleItemRecipies(req, res));
expressApp.post("/market-data", (req, res) => marketData(req, res)); /////
expressApp.get("/system-indexes/:systemID", (req, res) =>
  retrieveSystemIndex(req, res)
);
expressApp.post("/system-indexes", (req, res) =>
  retrieveMultipleSystemIndexes(req, res)
);

export default v1 = onRequest(
  {
    region: FIREBASE_SERVER_REGION,
    maxInstaces: DEFAULT_API_MAX_SERVER_INSTANCES,
  },
  expressApp
);
