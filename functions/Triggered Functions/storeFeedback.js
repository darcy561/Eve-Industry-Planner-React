const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { WebhookClient, EmbedBuilder } = require("discord.js");
const { uid } = require("uid");
require("dotenv").config();
const bucket = admin.storage().bucket();

const webhookClient = new WebhookClient({
  id: process.env.ID,
  token: process.env.TOKEN,
});

exports.submitUserFeedback = functions
  .region("europe-west1")
  .https.onCall((data, context) => {
    if (context.app === undefined) {
      functions.logger.warn("Unverified function Call");
      functions.logger.warn(context);
      throw new functions.https.HttpsError(
        "Unable to verify",
        "Function must be called from a verified app"
      );
    }
    try {
      let fileID = uid(16);
      if (data.esiData !== null) {
        bucket.file(`${fileID}.json`).save(JSON.stringify(data.esiData));
      }

      const embed = new EmbedBuilder()
        .setTitle("New Feedback")
        .setFields(
          { name: "AccountID", value: data.accountID, inline: false },
          {
            name: "ESI Data Included",
            value: data.esiData !== null ? "True" : "False",
            inline: false,
          },
          {
            name: "Document ID",
            value: data.esiData !== null ? fileID : "N/A",
          },
          { name: "Feedback Content", value: data.response, inline: false }
        )
        .setColor("#3D85C6");

      webhookClient.send({
        username: "Feedback Webhook",
        embeds: [embed],
      });
      functions.logger.log("Feedback Submitted Successfully");
    } catch (err) {
      functions.logger.error("Failed to submit feedback");
      functions.logger.error(err);
    }
  });
