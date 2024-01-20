import { AssetTemplate_AssetDialogWindow } from "./assetTemplate";
import { AssetContainerTemplate_AssetDialogWindow } from "./containerTemplate";

export function AssetLocationLogic_AssetDialogWindow({
  assetObject,
  assetsByLocation,
  assetLocationNames,
  useCorporationAssets
}) {
  if (!assetObject) return null;

  const matchedAssets = assetsByLocation.get(assetObject.item_id);

  if (matchedAssets) {
    return (
      <AssetContainerTemplate_AssetDialogWindow
        assetObject={assetObject}
        matchedAssets={matchedAssets}
        assetsByLocation={assetsByLocation}
        assetLocationNames={assetLocationNames}
        useCorporationAssets={useCorporationAssets}
      />
    );
  } else {
    return <AssetTemplate_AssetDialogWindow assetObject={assetObject} useCorporationAssets={useCorporationAssets} />;
  }
}
