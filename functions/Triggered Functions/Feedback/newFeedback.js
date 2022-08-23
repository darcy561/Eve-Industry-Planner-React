const functions = require("firebase-functions");
const { WebhookClient, EmbedBuilder } = require("discord.js");
require("dotenv").config();

const webhookClient = new WebhookClient({
  id: process.env.ID,
  token: process.env.TOKEN,
});

exports.newFeedback = functions
  .region("europe-west1")
  .firestore.document("Feedback/{DocID}")
  .onCreate((snapshot, context) => {
    const newDoc = snapshot.data();
    try {
      const embed = new EmbedBuilder()
        .setTitle("New Feedback")
        .setFields(
          { name: "AccountID", value: newDoc.accountID, inline: false },
          {
            name: "ESI Data Included",
            value: newDoc.esiData !== null ? "True" : "False",
            inline: false,
          },
          { name: "Feedback Content", value: newDoc.response, inline: false }
        )
        .setColor("#3D85C6");

      webhookClient.send({
        username: "Feedback Webhook",
        embeds: [embed],
      });
      return null;
    } catch (err) {
      functions.logger.info(err);
    }
  });
