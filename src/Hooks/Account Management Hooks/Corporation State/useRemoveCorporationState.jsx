export function useRemoveCorporatinState() {
  function removeCharacterFromCorporationState(
    characterObject,
    inputIndusyJobsMap,
    inputOrderMap,
    inputHistoricOrdersMap,
    inputBlueprintsMap
  ) {
    const corporationIndustryJobs = updateCorpMap(
      characterObject,
      inputIndusyJobsMap
    );
    const corpotationMarketOrders = updateCorpMap(
      characterObject,
      inputOrderMap
    );
    const corporationHistoricOrders = updateCorpMap(
      characterObject,
      inputHistoricOrdersMap
    );
    const corporationBlueprints = updateCorpMap(
      characterObject,
      inputBlueprintsMap
    );

    return {
      corporationIndustryJobs,
      corpotationMarketOrders,
      corporationHistoricOrders,
      corporationBlueprints,
    };
  }

  function updateCorpMap(characterObject, inputMap) {
    const { CharacterHash, corporation_id } = characterObject;
    const copiedMap = new Map(inputMap);
    const keysToRemove = new Set();

    const corporationObject = copiedMap.get(corporation_id);

    if (!corporationObject) return copiedMap;

    for (let i in corporationObject) {
      if (corporationObject[i].owners.length > 1) {
        corporationObject[i].owners = corporationObject[i].owners.filter(
          (cHash) => cHash !== CharacterHash
        );
      } else {
        if (corporationObject[i].owners.includes(CharacterHash)) {
          keysToRemove.add(i);
        }
      }
    }

    keysToRemove.forEach((key) => {
      delete corporationObject[key];
    });

    return copiedMap;
  }

  return removeCharacterFromCorporationState;
}
