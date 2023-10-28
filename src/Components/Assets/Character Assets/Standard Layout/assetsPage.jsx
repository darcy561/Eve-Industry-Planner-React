import { useEffect } from "react";
import { useAssetHelperHooks } from "../../../../Hooks/AssetHooks/useAssetHelper";

export function AssetsPage_Character({
  selectedCharacter,
  characterAssetMap,
  updateCharacterAssetMap,
}) {
  const { buildItemTree, findBlueprintTypeIDs } = useAssetHelperHooks();

  useEffect(() => {
    async function buildCharacterAssetsTree() {
      const assetsJSON = JSON.parse(
        sessionStorage.getItem(`assets_${selectedCharacter}`)
      );
      const blueprintTypeIDsSet = findBlueprintTypeIDs();
      const filteredAssets = assetsJSON.filter(
        (i) => !blueprintTypeIDsSet.has(i.type_id)
      );
        console.log(filteredAssets)
      const assetMap = buildItemTree(filteredAssets);
      console.log(assetMap); 
    }
    buildCharacterAssetsTree();
  }, []);

  return "assets";
}
