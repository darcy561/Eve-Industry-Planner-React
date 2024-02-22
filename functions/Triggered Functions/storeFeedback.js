const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { WebhookClient, EmbedBuilder } = require("discord.js");
const crypto = require("crypto");
require("dotenv").config();
const bucket = admin.storage().bucket();
const { GLOBAL_CONFIG } = require("../global-config-functions");

const { FIREBASE_SERVER_REGION } = GLOBAL_CONFIG;

const webhookClient = new WebhookClient({
  url: process.env.FEEDBACKURL,
});

exports.submitUserFeedback = functions
  .region(FIREBASE_SERVER_REGION)
  .https.onCall((data, context) => {
    if (!context.app) {
      functions.logger.warn("Unverified function Call");
      functions.logger.warn(context);
      throw new functions.https.HttpsError(
        "Unable to verify",
        "Function must be called from a verified app"
      );
    }
    try {
      let fileID = crypto.randomUUID();
      if (data.esiData) {
        bucket.file(`${fileID}.json`).save(JSON.stringify(data.esiData));
      }

      const embed = new EmbedBuilder()
        .setTitle("New Feedback")
        .setFields(
          { name: "AccountID", value: data.accountID, inline: false },
          {
            name: "ESI Data Included",
            value: data.esiData ? "True" : "False",
            inline: false,
          },
          {
            name: "Document ID",
            value: data.esiData ? fileID : "N/A",
          },
          { name: "Feedback Content", value: data.response, inline: false }
        )
        .setColor("#3D85C6");

      webhookClient.send({
        username: "Feedback Webhook",
        embeds: [embed],
      });
      functions.logger.log("Feedback Submitted Successfully");
      return null;
    } catch (err) {
      functions.logger.error("Failed to submit feedback");
      functions.logger.error(err);
    }
  });
