import uuid from "react-uuid";

export function useMaterialCosts() {
  function addPriceEntry(inputJob, inputMaterial, priceObject) {
    let newMaterialArray = [...inputJob.build.materials];
    let outputMaterial = { ...inputMaterial };

    outputMaterial.purchasing.push(convertPriceObject(priceObject));

    const newTotalPurchaseCost = recaclculateTotalPurchaseCost(
      newMaterialArray,
      outputMaterial
    );

    return { newMaterialArray, newTotalPurchaseCost };
  }

  function recaclculateTotalPurchaseCost(inputMaterialArray, inputMaterial) {
    for (let material of inputMaterialArray) {
      recalculateAndFixInvalidItemEntries(material);
    }
    return inputMaterialArray.reduce(
      (acc, entry) => acc + entry.purchasedCost,
      0
    );
  }

  function recalculateAndFixInvalidItemEntries(material) {
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

  function convertPriceObject(inputPriceObject) {
    return {
      id: uuid(),
      childID: inputPriceObject?.jobID || null,
      childJobImport: inputPriceObject.jobID ? true : false,
      itemCount: inputPriceObject.itemCount,
      itemCost: inputPriceObject.itemCost,
    };
  }

  return { addPriceEntry };
}
