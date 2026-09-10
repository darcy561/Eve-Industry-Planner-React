import {
  buildAssetLocationFlagMaps,
  buildAssetMaps,
  buildAssetMapsForCorporationOffices,
  buildAssetTypeIDMaps,
} from "./helpers/assetMaps";
import {
  buildAssetName,
  findAssetImageURL,
  formatAssetLocation,
  sortLocationMapsAlphabetically,
} from "./helpers/assetPresentation";
import { countAssetQuantityFromMap } from "./helpers/assetQuantities";

export {
  buildAssetMaps,
  buildAssetName,
  buildAssetLocationFlagMaps,
  buildAssetTypeIDMaps,
  countAssetQuantityFromMap,
  findAssetImageURL,
  sortLocationMapsAlphabetically,
};

export const buildAssetMapsCorpOffices = buildAssetMapsForCorporationOffices;
export const formatLocation = formatAssetLocation;
