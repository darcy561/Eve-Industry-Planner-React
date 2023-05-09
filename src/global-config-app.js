// This document changes the default behaviour of the application. Incorect values here will result in errors when deployed.

const GLOBAL_CONFIG = {
  //Firebase function deployment region, this must match what is specified within the functions global config.
  FIREBASE_FUNCTION_REGION: "europe-west1",

  PRIMARY_THEME: "dark",
  SECONDARY_THEME: "light",

  // Number of previous days ESI data will be retrieved for. (Number)
  ESI_DATE_PERIOD: 14,
  // Max number of ESI pages to query. (Number)
  ESI_MAX_PAGES: 50,

  DEFAULT_ITEM_REFRESH_PERIOD: 4,

  DEFAULT_ARCHIVE_REFRESH_PERIOD: 1,
  
  MARKET_OPTIONS: [
    { id: "amarr", name: "Amarr" },
    { id: "dodixie", name: "Dodixie" },
    { id: "jita", name: "Jita" },
  ],
  ENABLE_FEEDBACK_ICON: true,
};

export default GLOBAL_CONFIG;
