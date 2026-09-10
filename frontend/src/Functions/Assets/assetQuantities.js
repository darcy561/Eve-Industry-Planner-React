export function countAssetQuantityFromMap(inputMap, requestTypeID) {
  const requestedTypeIDArray = inputMap.get(requestTypeID);
  if (!requestedTypeIDArray || !inputMap || !requestTypeID) return 0;

  return requestedTypeIDArray.reduce((total, { quantity }) => {
    return (total += quantity);
  }, 0);
}
