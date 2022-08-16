import { useEveApi } from "./useEveApi";

export function useAccountManagement() {
  const {
    CharacterSkills,
    IndustryJobs,
    MarketOrders,
    HistoricMarketOrders,
    BlueprintLibrary,
    WalletJournal,
    WalletTransactions,
    fullAssetsList,
    IDtoName
  } = useEveApi();

  const buildMainUser = (userObject, userSettings) => {
    userObject.accountID = userSettings.accountID;
    userObject.linkedJobs = userSettings.linkedJobs;
    userObject.linkedTrans = userSettings.linkedTrans;
    userObject.linkedOrders = userSettings.linkedOrders;
    userObject.settings = userSettings.settings;
    userObject.snapshotData = JSON.parse(
      JSON.stringify(userSettings.jobArraySnapshot)
    );
    userObject.accountRefreshTokens = userSettings.refreshTokens;
    userObject.watchlist = userSettings.watchlist;

    return userObject
  }

  const characterAPICall = async (sStatus, userObject, parentObject) => {
    if (sStatus) {
      const [
        skills,
        indJobs,
        orders,
        histOrders,
        blueprints,
        transactions,
        journal,
        assets,
      ] = await Promise.all([
        CharacterSkills(userObject),
        IndustryJobs(userObject, parentObject),
        MarketOrders(userObject),
        HistoricMarketOrders(userObject),
        BlueprintLibrary(userObject),
        WalletTransactions(userObject),
        WalletJournal(userObject),
        fullAssetsList(userObject),
      ]);

      userObject.apiSkills = skills;
      userObject.apiJobs = indJobs;
      userObject.apiOrders = orders;
      userObject.apiHistOrders = histOrders;
      userObject.apiBlueprints = blueprints;
      userObject.apiTransactions = transactions;
      userObject.apiJournal = journal;
      sessionStorage.setItem(
        `assets_${userObject.CharacterHash}`,
        JSON.stringify(assets)
      );
    } else {
      userObject.apiSkills = [];
      userObject.apiJobs = [];
      userObject.apiOrders = [];
      userObject.apiHistOrders = [];
      userObject.apiBlueprints = [];
      userObject.apiTransactions = [];
      userObject.apiJournal = [];
      sessionStorage.setItem(
        `assets_${userObject.CharacterHash}`,
        JSON.stringify([])
      );
    }

    return userObject;
  };

  const generateItemPriceRequest = (settings) => {
    let priceIDRequest = new Set();
    settings.jobArraySnapshot.forEach((snap) => {
      snap.materialIDs.forEach((id) => {
        priceIDRequest.add(id);
      });
      priceIDRequest.add(snap.itemID);
    });
    settings.watchlist.items.forEach((snap) => {
      priceIDRequest.add(snap.typeID);
      snap.materials.forEach((mat) => {
        priceIDRequest.add(mat.typeID);
        mat.materials.forEach((cMat) => {
          priceIDRequest.add(cMat.typeID);
        });
      });
    });

    return [...priceIDRequest];
  };

  const getLocationNames = async (users, mainUser) => {
    let locationIDS = new Set();
    let citadelStore = new Set();
    let newIDNamePromises = [];
    let newNameArray = [];

    for (let user of users) {
      let citadelIDs = new Set();
      if (user.ParentUser) {
        if (user.settings.editJob.defaultAssetLocation.toString().length > 10) {
          if (!citadelStore.has(user.settings.editJob.defaultAssetLocation)) {
            citadelIDs.add(user.settings.editJob.defaultAssetLocation);
            citadelStore.add(user.settings.editJob.defaultAssetLocation);
          }
        } else {
          locationIDS.add(user.settings.editJob.defaultAssetLocation);
        }
      }
      user.apiJobs.forEach((job) => {
        if (job.facility_id.toString().length > 10) {
          if (!citadelStore.has(job.facility_id)) {
            citadelIDs.add(job.facility_id);
            citadelStore.add(job.facility_id);
          }
        } else {
          locationIDS.add(job.facility_id);
        }
      });
      user.apiOrders.forEach((order) => {
        if (order.location_id.toString().length > 10) {
          if (!citadelStore.has(order.location_id)) {
            citadelIDs.add(order.location_id);
            citadelStore.add(order.location_id);
          }
        } else {
          locationIDS.add(order.location_id);
        }
        locationIDS.add(order.region_id);
      });
      user.apiHistOrders.forEach((order) => {
        if (order.location_id.toString().length > 10) {
          if (!citadelStore.has(order.location_id)) {
            citadelIDs.add(order.location_id);
            citadelStore.add(order.location_id);
          }
        } else {
          locationIDS.add(order.location_id);
        }
        locationIDS.add(order.region_id);
      });
      if ([...citadelIDs].length > 0) {
        newIDNamePromises.push(IDtoName([...citadelIDs], user));
      }
    }
    if ([...locationIDS].length > 0) {
      newIDNamePromises.push(IDtoName([...locationIDS], mainUser));
    }

    let returnLocations = await Promise.all(newIDNamePromises);

    returnLocations.forEach((group) => {
      newNameArray = newNameArray.concat(group);
    });

    return newNameArray
  }

  return { buildMainUser, characterAPICall, generateItemPriceRequest, getLocationNames };
}
