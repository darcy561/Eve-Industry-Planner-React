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
  } = useEveApi();

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
    settings.watchlist.forEach((snap) => {
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

  return { characterAPICall, generateItemPriceRequest };
}
