const functions = require("firebase-functions");
const { WebhookClient } = require("discord.js");
const axios = require("axios");
require("dotenv").config();

exports.checkSDEUpdates = functions
  .region("europe-west1")
  .pubsub.schedule("0 16 * * *")
  .timeZone("Etc/GMT")
  .onRun(async (context) => {
    const sdeUrl =
      "https://eve-static-data-export.s3-eu-west-1.amazonaws.com/tranquility/sde.zip";

    const discordWebhookUrl = process.env.CHECKSDEURL;

    const last24HoursTimestamp = Date.now() - 24 * 60 * 60 * 1000;

    const options = {
      url: sdeUrl,
      method: "HEAD",
    };
    try {
      const response = await axios(options);
      const lastModified = response.headers["last-modified"];
      const lastModifiedTimestamp = Date.parse(lastModified);
      
      if (lastModifiedTimestamp > last24HoursTimestamp) {
        const webhookClient = new WebhookClient({ url: discordWebhookUrl });
        const message = `Hey <@${
          process.env.DISCORDUSERID
        }>, the SDE has been updated! Last modified: ${new Date(
          lastModifiedTimestamp
        ).toLocaleString("en-GB", { timeZone: "Europe/London" })} GMT`;
        await webhookClient.send(message);
      } else {
        functions.logger.log("SDE not updated within the last 24 hours");
      }
    } catch (error) {
      functions.logger.error(error);
    }
    return null;
  });
