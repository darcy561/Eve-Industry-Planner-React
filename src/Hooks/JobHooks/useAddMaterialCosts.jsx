import uuid from "react-uuid";

export function useAddMaterialCostsToJob(inputJob, inputPriceArray) {
  let newMaterialArray = [...inputJob.build.materials];
  for (let itemPriceObject of inputPriceArray) {
    const matchedMaterial = newMaterialArray.find(
      (i) => i.typeID === itemPriceObject.typeID
    );
    if (!matchedMaterial) continue;

    if (itemPriceObject.itemCount === "allRemaining") {
      addAllRemainingItems(matchedMaterial, itemPriceObject);
    } else {
      recalculateAndFixInvalidItemEntries(matchedMaterial, itemPriceObject);
    }
  }

  const newTotalPurchaseCost = newMaterialArray.reduce(
    (acc, entry) => acc + entry.purchasedCost,
    0
  );
  return { newMaterialArray, newTotalPurchaseCost };
}

export function useBuildMaterialPriceObject(
  typeID,
  itemCount,
  itemCost,
  childJobID = null
) {
  return {
    typeID,
    id: uuid(),
    childID: childJobID,
    childJobImport: childJobID ? true : false,
    itemCount,
    itemCost,
  };
}

function recalculateAndFixInvalidItemEntries(material, itemPriceObject) {
  if (material.purchaseComplete) return;

  material.purchasing.push(itemPriceObject);

  filterInvalidEntries(material);

  const { newQuantity, newPurchaseCost } = material.purchasing.reduce(
    (acc, entry) => {
      const maxAllowedQuantity = material.quantity - acc.newQuantity;
      const itemCountToAdd = Math.min(entry.itemCount, maxAllowedQuantity);

      return {
        newQuantity: acc.newQuantity + itemCountToAdd,
        newPurchaseCost: acc.newPurchaseCost + itemCountToAdd * entry.itemCost,
      };
    },
    { newQuantity: 0, newPurchaseCost: 0 }
  );

  material.quantityPurchased = newQuantity;
  material.purchasedCost = newPurchaseCost;

  if (material.quantityPurchased >= material.quantity) {
    material.purchaseComplete = true;
  }
}

function addAllRemainingItems(material, itemPriceObject) {
  if (material.purchaseComplete) return;
  filterInvalidEntries(material);
  const remainingItemsRequired = material.quantity - material.quantityPurchased;
  material.purchasing.push(
    useBuildMaterialPriceObject(
      material.typeID,
      remainingItemsRequired,
      itemPriceObject.itemCost,
      itemPriceObject.childID
    )
  );

  const { newQuantity, newPurchaseCost } = material.purchasing.reduce(
    (acc, entry) => ({
      newQuantity: acc.newQuantity + entry.itemCount,
      newPurchaseCost: acc.newPurchaseCost + entry.itemCount * entry.itemCost,
    }),
    { newQuantity: 0, newPurchaseCost: 0 }
  );

  material.quantityPurchased = newQuantity;
  material.purchasedCost = newPurchaseCost;

  if (material.quantityPurchased >= material.quantity) {
    material.purchaseComplete = true;
  }
}

function filterInvalidEntries(material) {
  const invalidItems = material.purchasing.filter((item) => {
    return (
      isNaN(item.itemCount) ||
      item.itemCount < 0 ||
      isNaN(item.itemCost) ||
      item.itemCost < 0
    );
  });

  if (invalidItems.length > 0) {
    material.purchasing = material.purchasing.filter(
      (item) => !invalidItems.includes(item)
    );
  }
}
