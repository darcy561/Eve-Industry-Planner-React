import GLOBAL_CONFIG from "../../../global-config-app";
import fetchAllPages from "../getAllPages";

async function getCorpJournal(character) {
  try {
    if (!character || !character.aToken || !character.corporation_id) {
      throw new Error("Character information is incomplete.");
    }
    const { aToken, corporation_id } = character;
    const { ESI_DATE_PERIOD } = GLOBAL_CONFIG;
    const maxDivisions = 7;
    const currentDate = Date.now();
    const refTypes = new Set([
      "brokers_fee",
      "market_escrow",
      "market_transaction",
      "transaction_tax",
    ]);

    async function fetchAndFilterDivisionJournal(division) {
      try {
        const endpointURL = `https://esi.evetech.net/latest/corporations/${corporation_id}/wallets/${division}/journal/?token=${aToken}`;
        const divisionArray = await fetchAllPages(endpointURL);
        return {
          division,
          data: divisionArray.filter(
            (item) =>
              currentDate - Date.parse(item.date) <=
                ESI_DATE_PERIOD * 24 * 60 * 60 * 1000 &&
              refTypes.has(item.ref_type)
          ),
        };
      } catch (err) {
        console.error(
          `Error fetching transactions for division ${division}: ${err}`
        );
        return { division, data: [] };
      }
    }

    const divisionPromises = Array.from({ length: maxDivisions }, (_, i) =>
      fetchAndFilterDivisionJournal(i + 1)
    );
    const journals = await Promise.all(divisionPromises);

    return journals;
  } catch (err) {
    console.error(`Error fetching corporation journal: ${err}`);
    return [];
  }
}

export default getCorpJournal;
