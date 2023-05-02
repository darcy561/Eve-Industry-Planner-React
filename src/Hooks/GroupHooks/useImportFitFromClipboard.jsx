import { useContext } from "react";
import itemTypes from "../../RawData/searchIndex.json";
import { ActiveJobContext } from "../../Context/JobContext";

export function useImportFitFromClipboard() {
  const { activeGroup } = useContext(ActiveJobContext);

  const importFromClipboard = async () => {
    const itemNameRegex = /^\[(?<itemName>.+),\s*(?<fittingName>.+)\]/g;
    const itemMatchesRegex = /^[^\[\r\n]+|^(?:(?!\[|\sx\d).)+/gm;
    const itemWithQuantitiesRegex = /^(?<item>[^\n]*?)\s*x(?<quantity>\d+)/gm;

    const importedText = await navigator.clipboard.readText();
    const itemNameMatch = [...importedText.matchAll(itemNameRegex)];
    const itemMatches = [...importedText.matchAll(itemMatchesRegex)];
    const itemsWithQuantities = [
      ...importedText.matchAll(itemWithQuantitiesRegex),
    ];
      
      console.log(itemNameMatch)
      console.log(itemMatches)
      console.log(itemsWithQuantities)

    if (itemNameMatch.length === 0) {
      return [];
    }

    const filteredItemMatches = itemMatches
      .filter((match) => !match[0].match(/\sx\d/))
      .map((match) => match[0].trim());

    const objectArray = [
      { itemName: itemNameMatch[0].groups.itemName, itemQty: 1 },
    ];

    filteredItemMatches.forEach((itemName) => {
      const foundItem = objectArray.find((item) => item.itemName === itemName);
      if (foundItem) {
        foundItem.itemQty += 1;
      } else {
        objectArray.push({ itemName, itemQty: 1 });
      }
    });

    itemsWithQuantities.forEach((match) => {
      objectArray.push({
        itemName: match.groups.item,
        quantity: match.groups.quantity,
      });
    });

    for (let i = objectArray.length - 1; i >= 0; i--) {
      const matchingItemType = itemTypes.find(
        (itemType) => itemType.name === objectArray[i].itemName
      );
      if (matchingItemType) {
        objectArray[i].itemID = matchingItemType.itemID;
      } else {
        objectArray.splice(i, 1);
      }
    }
      console.log(objectArray);
    
    return objectArray
  };
    
  return {
    importFromClipboard,
  };
}
