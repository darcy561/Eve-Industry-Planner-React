const functions = require("firebase-functions");
const admin = require("firebase-admin");


exports.createUserData = functions.https.onCall((data, context) => {
    if (context.app == undefined) {
        throw new functions.https.HttpsError(
            'Unable to verify',
            'The function must be called from a verified app.')
    }
    const setupData = {
        uid: context.auth.uid,
        accountID: `CHAR${Date.now()}`,
        jobStatusArray: [
            { id: 0, name: "Planning", sortOrder: 0, expanded: true, openAPIJobs: false, completeAPIJobs: false },
            { id: 1, name: "Purchasing", sortOrder: 1, expanded: true, openAPIJobs: false, completeAPIJobs: false },
            { id: 2, name: "Building", sortOrder: 2, expanded: true, openAPIJobs: true, completeAPIJobs: false },
            { id: 3, name: "Complete", sortOrder: 3, expanded: true, openAPIJobs: false, completeAPIJobs: true },
            { id: 4, name: "For Sale", sortOrder: 4, expanded: true, openAPIJobs: false, completeAPIJobs: false }
        ],
        deleted: null,
        jobArraySnapshot: {},
        linkedJobs: [],
    }
    admin.firestore().collection("Users").doc(context.auth.uid).set(setupData);
    return setupData
})

exports.markUserDeletion = functions.https.onCall((data, context) => {
    console.log(`deleted`);
});