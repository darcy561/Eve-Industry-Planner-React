export function useUpdateCorporationState() {
  function updateCharacterDataInCorporationState(
    characterESIObject,
    inputIndusyJobsMap,
    inputOrderMap,
    inputHistoricOrdersMap,
    inputBlueprintsMap
  ) {
    const corpIndustyJobs = updateCorpMap(
      characterESIObject,
      inputIndusyJobsMap,
      "esiCorpJobs",
      "job_id"
    );
    const corpMarketOrders = updateCorpMap(
      characterESIObject,
      inputOrderMap,
      "esiCorpMOrders",
      "order_id"
    );
    const corpHistoricMarketOrders = updateCorpMap(
      characterESIObject,
      inputHistoricOrdersMap,
      "esiCorpHistMOrders",
      "order_id"
    );
    const corpBlueprints = updateCorpMap(
      characterESIObject,
      inputBlueprintsMap,
      "esiCorpBlueprints",
      "item_id"
    );

    return {
      corpIndustyJobs,
      corpMarketOrders,
      corpHistoricMarketOrders,
      corpBlueprints,
    };
  }

  function updateCorpMap(esiObject, inputMap, requiredAttribute, key) {
    const copiedMap = new Map(inputMap);
    const data = esiObject[requiredAttribute];
    const incomingObjectIDs = new Set();
    const existingObjectsToRemove = new Set();
    const corpObject = copiedMap.get(esiObject.corporation_id);
    if (!corpObject) {
      const newCorpObect = addNewCorpToMap(esiObject.owner, data, key);
      copiedMap.set(esiObject.corporation_id, newCorpObect);
      return copiedMap;
    }

    data.forEach((incomingObject) => {
      incomingObjectIDs.add(incomingObject[key]);

      if (corpObject.hasOwnProperty(incomingObject[key])) {
        const newOwners = [
          ...corpObject[incomingObject[key]].owners,
          esiObject.owner,
        ];
        corpObject[incomingObject[key]] = incomingObject;
        corpObject[incomingObject[key]].owners = newOwners;
      } else {
        corpObject[incomingObject[key]] = incomingObject;
        corpObject[incomingObject[key]].owners = [esiObject.owner];
      }
    });

    for (let i in corpObject) {
      let selectedObject = corpObject[i];
      if (!incomingObjectIDs.has(i)) continue;

      if (selectedObject.owners.length > 1) {
        selectedObject.owners = selectedObject.owners.filter(
          (x) => x !== esiObject.owner
        );
      } else if (selectedObject.owners.includes(esiObject.owner)) {
        existingObjectsToRemove.add(i);
      }
    }

    existingObjectsToRemove.forEach((key) => {
      delete corpObject[key];
    });

    copiedMap.set(esiObject.corporation_id, corpObject);

    return copiedMap;
  }

  function addNewCorpToMap(owner, dataToAdd, key) {
    const newCorpObject = {};

    dataToAdd.forEach((obj) => {
      newCorpObject[obj[key]] = obj;
      newCorpObject[obj[key]].owners = [owner];
    });
    return newCorpObject;
  }

  return updateCharacterDataInCorporationState;
}
