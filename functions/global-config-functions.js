// This document changes the default server functions. Incorect values here will result in errors when deployed.

exports.GLOBAL_CONFIG = {
  //Firebase Deployment

  FIREBASE_SERVER_REGION: "europe-west1",
  FIREBASE_SERVER_TIMEZONE: "Etc/GMT",

  //App Version
  //This must match the app version found in the package.json file of the web application.
  //(String)
  APP_VERSION: "0.6.2",

  // Max number of ESI pages to query.
  //(Int)
  //Default: 50
  ESI_MAX_PAGES: 50,

  //Market Data Locations
  //(Object Array)
  //E.G { name: "jita", regionID: 10000002, stationID: 60003760 }
  // This market data must be publicly accesible, private markets in citadels cannot be used.
  DEFAULT_MARKET_LOCATIONS: [
    { name: "jita", regionID: 10000002, stationID: 60003760 },
    { name: "amarr", regionID: 10000043, stationID: 60008494 },
    { name: "dodixie", regionID: 10000032, stationID: 60011866 },
  ],
  //Number of hours between updates of item market data.
  //(Int)
  //Default: 4
  DEFAULT_ITEM_PRICE_REFRESH_PERIOD: 4,

  //Number of items that are refreshed at a time.
  //(Int)
  //Default: 150
  DEFAULT_ITEM_MARKET_REFRESH_QUANTITY: 50,

  //Number of hours between updates to item history data.
  //(Int)
  //Default: 4
  DEFAULT_ITEM_HISTROY_REFRESH_PERIOD: 4,

  //Number of items market history to refresh each period.
  //(Int)
  //Default: 50
  DEFAULT_ITEM_MARKET_HISTORY_REFRESH_QUANTITY: 150,

  //Length of time the market history is calaculated on.
  //(Int)
  //Default: 30
  DEFAULT_DAYS_FOR_MARKET_HISTORY: 30,

  //Account Creation: These settings define the default settings that are used when new accounts are created.

  //Enables/disabled the saving of characters to the cloud by default.
  //(Boolean)
  //Default: false
  DEFAULT_CLOUD_ACCOUNTS: false,

  //Default market location.
  //(String)
  //Default: "jita"
  //If using a custom location, this must match the defined name.
  DEFAULT_MARKET_OPTION: "jita",

  //Default order type.
  //(String)
  //Default: "sell"
  //Options: "buy", "sell"
  DEFAULT_ORDER_OPTION: "sell",


  //Default asset location station id.
  //(Int)
  //Default: 60003760 (Jita 4-4)
  DEFAULT_ASSET_LOCATION: 60003760,

  //Default citadel brokers fee percentage.
  //(Int)
  //Default: 1
  DEFAULT_CITADEL_BROKERS_FEE: 1,

  DEFAULT_MANUFACTURING_STRUCTURES: [],
  DEFAULT_REACTION_STRUCTURES: [],
};
