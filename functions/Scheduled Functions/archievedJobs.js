const functions = require("firebase-functions");
const admin = require("firebase-admin");
const GLOBAL_CONFIG = require("../global-config-functions");

const { FIREBASE_SERVER_REGION, FIREBASE_SERVER_TIMEZONE } = GLOBAL_CONFIG;

exports.scheduledfunction = functions
  .region(FIREBASE_SERVER_REGION)
  .runWith({ timeoutSeconds: 540 })
  .pubsub.schedule("every 1 hours")
  .timeZone(FIREBASE_SERVER_TIMEZONE)
  .onRun(async (context) => {
    let snapshotArray = [];
    const snapshot = await admin
      .firestore()
      .collectionGroup("ArchivedJobs")
      .where("archiveProcessed", "==", false)
      .get();
    snapshot.forEach((doc) => {
      snapshotArray.push(doc);
    });

    if (snapshotArray.length === 0) {
      functions.logger.info(`0 Archived Jobs To Process`);
      return null;
    }
    for (let doc of snapshotArray) {
      let job = doc.data();

      const brokersFeesTotal = job.build.sale.brokersFee.reduce(
        (total, item) => total + item.amount,
        0
      );
      const { transactionFeeTotal, totalSale, averageQuantity } =
        job.build.sale.transactions.reduce(
          (totals, item) => ({
            transactionFeeTotal: totals.transactionFeeTotal + item.tax,
            totalSale: totals.totalSale + item.amount,
            averageQuantity: totals.averageQuantity + item.quantity,
          }),
          { transactionFeeTotal: 0, totalSale: 0, averageQuantity: 0 }
        );
      const totalProduced = job.build.products.totalQuantity;
      const totalMaterialCost = job.build.costs.totalPurchaseCost;
      const materialCostPerItem = totalMaterialCost / totalProduced;
      const totalInventionCost = job.build.costs.inventionCosts || 0;
      const totalInstallCost = job.build.costs.installCosts;
      const totalExtras = job.build.costs.extrasTotal;
      const totalBuildCosts =
        totalMaterialCost + totalInstallCost + totalExtras;
      const totalJobCost =
        totalBuildCosts + brokersFeesTotal + transactionFeeTotal;
      const totalCostPerItem =
        Math.round((totalJobCost / totalProduced + Number.EPSILON) * 100) / 100;
      const totalSales = totalSale;
      const averageSalePrice = !isNaN(
        Math.round((totalSale / averageQuantity + Number.EPSILON) * 100) / 100
      )
        ? Math.round((totalSale / averageQuantity + Number.EPSILON) * 100) / 100
        : 0;
      const profitLoss = totalSale > 0 ? totalSale - totalJobCost : 0;
      const corpMarketOrder = job.build.sale.marketOrders.reduce(
        (res, order) => {
          if (order.is_corporation) {
            res = true;
          }
          return res;
        },
        false
      );
      const corpIndustyJob = job.build.costs.linkedJobs.reduce(
        (res, linkedJob) => {
          if (linkedJob.isCorp) {
            res = true;
          }
          return res;
        },
        false
      );

      const archiveObject = {
        typeID: job.itemID,
        jobID: job.jobID,
        jobType: job.jobType,
        processDate: Date.now(),
        bpME: job.bpME,
        bpTE: job.bpTE,
        runs: job.runCount,
        jobs: job.jobCount,
        childJob: !!job.parentJob?.length,
        totalProduced,
        totalMaterialCost,
        materialCostPerItem,
        totalInventionCost,
        totalInstallCost,
        totalExtras,
        totalBuildCosts,
        brokersFeeTotal: brokersFeesTotal,
        transactionFeeTotal,
        totalJobCost,
        totalCostPerItem,
        totalSales,
        averageSalePrice,
        profitLoss,
        corpMarketOrder,
        corpIndustyJob,
      };

      let dbObject = {
        jobType: archiveObject.jobType,
        typeID: archiveObject.typeID,
        totalJobs: admin.firestore.FieldValue.increment(1),
        itemBuildCount: admin.firestore.FieldValue.increment(
          archiveObject.totalProduced
        ),
        buildCostTotal: admin.firestore.FieldValue.increment(
          archiveObject.totalBuildCosts
        ),
        brokersFeeTotal: admin.firestore.FieldValue.increment(
          archiveObject.brokersFeeTotal
        ),
        transactionFeeTotal: admin.firestore.FieldValue.increment(
          archiveObject.transactionFeeTotal
        ),
        jobCostTotal: admin.firestore.FieldValue.increment(
          archiveObject.totalJobCost
        ),
        salesTotal: admin.firestore.FieldValue.increment(
          archiveObject.totalSales
        ),
        profitLoss: admin.firestore.FieldValue.increment(
          archiveObject.profitLoss
        ),
        dataSnapshots: admin.firestore.FieldValue.arrayUnion(archiveObject),
      };

      let buildStat = await admin
        .firestore()
        .collection(`Users/${doc.ref.parent.parent.id}/BuildStats`)
        .doc(job.itemID.toString())
        .get();

      if (buildStat.exists) {
        await admin
          .firestore()
          .collection(`Users/${doc.ref.parent.parent.id}/BuildStats`)
          .doc(job.itemID.toString())
          .update(dbObject);
      } else {
        await admin
          .firestore()
          .collection(`Users/${doc.ref.parent.parent.id}/BuildStats`)
          .doc(job.itemID.toString())
          .set(dbObject);
      }
      await admin
        .firestore()
        .collection(`Users/${doc.ref.parent.parent.id}/ArchivedJobs`)
        .doc(job.jobID.toString())
        .update({ archiveProcessed: true });
    }
    functions.logger.info(`${snapshotArray.length} Archived Jobs Processed`);

    return null;
  });
