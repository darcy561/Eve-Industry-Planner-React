import getCharacterIndustryJobs from "./Character/getIndustryJobs";
import getCharacterMarketOrders from "./Character/getMarketOrders";
import getCharacterSkills from "./Character/getSkills";
import getCharacterHistoricMarketOrders from "./Character/getHistoricMarketOrders";
import getCharacterBlueprints from "./Character/getBlueprints";
import getCharacterTransactions from "./Character/getTransactions";
import getCharacterJournal from "./Character/getJournal";
import getCharacterAssets from "./Character/getAssets";
import getCharacterStandings from "./Character/getStandings";
import getCorpIndustryJobs from "./Corporation/getIndustryJobs";
import getCorpMarketOrders from "./Corporation/getMarketOrders";
import getCorpHistoricMarketOrders from "./Corporation/getHistoricMarketOrders";
import getCorpBlueprints from "./Corporation/getBlueprints";
import getCorpJournal from "./Corporation/getJournal";
import getCorpTransactions from "./Corporation/getTransactions";
import getCorpDivisions from "./Corporation/getDivisions";
import getCorpPublicInfo from "./Corporation/getPublicData";
import getCorpAssets from "./Corporation/getAssets";

const requiredCharacterESICalls = {
  esiSkills: getCharacterSkills,
  esiJobs: getCharacterIndustryJobs,
  esiOrders: getCharacterMarketOrders,
  esiHistOrders: getCharacterHistoricMarketOrders,
  esiBlueprints: getCharacterBlueprints,
  esiTransactions: getCharacterTransactions,
  esiJournal: getCharacterJournal,
  esiAssets: getCharacterAssets,
  esiStandings: getCharacterStandings,
  esiCorpJobs: getCorpIndustryJobs,
  esiCorpMOrders: getCorpMarketOrders,
  esiCorpHistMOrders: getCorpHistoricMarketOrders,
  esiCorpBlueprints: getCorpBlueprints,
  esiCorpJournal: getCorpJournal,
  esiCorpTransactions: getCorpTransactions,
  esiCorpDivisions: getCorpDivisions,
  esiCorpPublicInfo: getCorpPublicInfo,
  esiCorpAssets: getCorpAssets,
};

export default requiredCharacterESICalls;
