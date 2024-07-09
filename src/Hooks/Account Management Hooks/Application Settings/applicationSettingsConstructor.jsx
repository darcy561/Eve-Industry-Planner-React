class ApplicationSettings {
  constructor(settings) {
    this.cloudAccounts = settings.cloudAccounts;
    this.hideTutorials = settings.hideTutorials;
    this.localMarketDisplay = settings.localMarketDisplay;
    this.localOrderDisplay = settings.localOrderDisplay;
    this.esiJobTab = settings.esiJobTab;
    this.defaultMarket = settings.defaultMarket;
    this.defaultOrders = settings.defaultOrders;
    this.hideCompleteMaterials = settings.hideCompleteMaterials;
    this.defaultAssetLocation = settings.defaultAssetLocation;
    this.citadelBrokersFee = settings.citadelBrokersFee;
    this.manufacturingStructures = settings.manufacturingStructures;
    this.reactionStructures = settings.reactionStructures;
  }
}
const applicationSettingsConverter = {
  toFirestore: (settings) => {
    return {
      cloudAccounts: settings.cloudAccounts,
      hideTutorials: settings.hideTutorials,
      localMarketDisplay: settings.localMarketDisplay,
      localOrderDisplay: settings.localOrderDisplay,
      esiJobTab: settings.esiJobTab,
      defaultMarket: settings.defaultMarket,
      defaultOrders: settings.defaultOrders,
      hideCompleteMaterials: settings.hideCompleteMaterials,
      defaultAssetLocation: settings.defaultAssetLocation,
      citadelBrokersFee: settings.citadelBrokersFee,
      manufacturingStructures: settings.manufacturingStructures,
      reactionStructures: settings.reactionStructures,
    };
  },
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    return new ApplicationSettings(data);
  },
};

export default applicationSettingsConverter;
