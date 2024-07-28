import GLOBAL_CONFIG from "../../../global-config-app";
import fetchAllPages from "../getAllPages";

async function getCorpTransactions(character) {
  try {
    if (!character || !character.aToken || !character.corporation_id) {
      throw new Error("Character information is incomplete.");
    }
    const { aToken, corporation_id } = character;
    const { ESI_DATE_PERIOD } = GLOBAL_CONFIG;
    const maxDivisions = 7;
    const currentDate = Date.now();

    async function fetchAndFilterDivisionTransactions(division) {
      try {
        const endpointURL = `https://esi.evetech.net/latest/corporations/${corporation_id}/wallets/${division}/transactions?token=${aToken}`;
        const divisionArray = await fetchAllPages(endpointURL);
        return {
          division,
          data: divisionArray.filter(
            (item) =>
              currentDate - Date.parse(item.date) <=
                ESI_DATE_PERIOD * 24 * 60 * 60 * 1000 && !item.is_buy
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
      fetchAndFilterDivisionTransactions(i + 1)
    );

    const transactions = await Promise.all(divisionPromises);
    return transactions;
  } catch (err) {
    console.error(`Error fetching corporation transactions: ${err}`);
    return [];
  }
}

export default getCorpTransactions;
