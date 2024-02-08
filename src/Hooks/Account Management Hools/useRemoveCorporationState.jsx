export function useRemoveCorporatinState() {
  function removeCharacterFromCorporationState(
    characterHashToRemove,
    inputMap
  ) {
    const copiedMap = new Map(inputMap);
    console.log(copiedMap);
    copiedMap.forEach((corporationObject, corporation_id) => {
      const keysToRemove = new Set();


      for (let key in corporationObject) {
        const value = corporationObject[key];
        if (value.owners.length > 1) {
          value.owners = value.owners.filter(
            (owner) => owner !== characterHashToRemove
          );
        } else if (value.owners.includes(characterHashToRemove)) {
          keysToRemove.add(key);
        }
      }

      keysToRemove.forEach((key) => {
        delete corporationObject[key];
      });
    });

    return copiedMap;
  }
  return removeCharacterFromCorporationState;
}
