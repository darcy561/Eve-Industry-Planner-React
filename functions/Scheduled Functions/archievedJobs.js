const functions = require("firebase-functions");
const admin = require("firebase-admin");

exports.scheduledfunction = functions.region("europe-west1").runWith({timeoutSeconds:540}).pubsub
  .schedule("every 6 hours")
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

    if (snapshotArray.length > 0) {
      for (let doc of snapshotArray) {
        let job = doc.data();

        let transactionFeeTotal = 0;
        let totalSale = 0;
        let averageQuantity = 0;
        let brokersFeesTotal = 0;

        job.build.sale.brokersFee.forEach(
          (item) => (brokersFeesTotal += item.amount)
        );
        job.build.sale.transactions.forEach((item) => {
          transactionFeeTotal += item.tax;
          totalSale += item.amount;
          averageQuantity += item.quantity;
        });

        let archiveObject = {
          typeID: job.itemID,
          jobID: job.jobID,
          jobType: job.jobType,
          processDate: Date.now(),
          bpME: job.bpME,
          bpTE: job.bpTE,
          runs: job.runCount,
          jobs: job.jobCount,
          childJob:
            job.parentJob !== undefined && job.parentJob !== null
              ? job.parentJob.length > 0
                ? true
                : false
              : false,
          totalProduced: job.build.products.totalQuantity,
          totalMaterialCost: job.build.costs.totalPurchaseCost,
          materialCostPerItem:
            job.build.costs.totalPurchaseCost /
            job.build.products.totalQuantity,
          totalInventionCost: job.build.costs.inventionCosts || 0,
          totalInstallCost: job.build.costs.installCosts,
          totalExtras: job.build.costs.extrasTotal,
          totalBuildCosts:
            job.build.costs.totalPurchaseCost +
            job.build.costs.installCosts +
            job.build.costs.extrasTotal,
          brokersFeeTotal: brokersFeesTotal,
          transactionFeeTotal: transactionFeeTotal,
          totalJobCost:
            job.build.costs.totalPurchaseCost +
            job.build.costs.installCosts +
            job.build.costs.extrasTotal +
            brokersFeesTotal +
            transactionFeeTotal,
          totalCostPerItem:
            Math.round(
              ((job.build.costs.totalPurchaseCost +
                job.build.costs.installCosts +
                job.build.costs.extrasTotal +
                brokersFeesTotal +
                transactionFeeTotal) /
                job.build.products.totalQuantity +
                Number.EPSILON) *
                100
            ) / 100,
          totalSales: totalSale,
          averageSalePrice: !isNaN(
            Math.round((totalSale / averageQuantity + Number.EPSILON) * 100) /
              100
          )
            ? Math.round((totalSale / averageQuantity + Number.EPSILON) * 100) /
              100
            : 0,
          profitLoss:
            totalSale > 0
              ? totalSale -
                (job.build.costs.totalPurchaseCost +
                  job.build.costs.installCosts +
                  job.build.costs.extrasTotal +
                  brokersFeesTotal +
                  transactionFeeTotal)
              : 0,
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
    }
    functions.logger.info(`${snapshotArray.length} Archived Jobs Processed`);
    return null;
  });
