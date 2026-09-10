import { useMemo } from "react";
import useAssetIndex, { ASSET_SCOPE } from "./useAssetIndex";
import useLocationNames from "./useLocationNames";
import assetLocationIds from "../../Functions/Assets/assetLocationIds";
import { isNoAccessLocation } from "../../Functions/Assets/assetLocationConstants";

/**
 * The named locations a scope's assets sit at, ready for a dropdown.
 *
 * Three dropdowns offer this list and each held its own copy of the rules — which location kinds
 * count, that an unreadable structure is dropped, and that the order is alphabetical by name. They
 * read it from here instead, so a location offered on one is offered on all of them.
 *
 * @param {{scope?: string, id?: string|number, enabled?: boolean}} [request]
 * @returns {{locations: Array<{locationId: number, name: string}>, isLoading: boolean, isError: boolean}}
 */
export default function useAssetLocations({
  scope = ASSET_SCOPE.CHARACTERS,
  id,
  enabled = true,
} = {}) {
  const {
    data: collection,
    isLoading: assetsLoading,
    isError: assetsError,
  } = useAssetIndex({ scope, id, enabled });

  const locationIds = useMemo(
    () => (enabled ? assetLocationIds(collection) : []),
    [collection, enabled]
  );

  const {
    names,
    isLoading: namesLoading,
    isError: namesError,
  } = useLocationNames(locationIds);

  const locations = useMemo(
    () =>
      locationIds
        .filter((locationId) => {
          const location = names[locationId];
          return Boolean(location) && !isNoAccessLocation(location);
        })
        .map((locationId) => ({
          locationId,
          name: names[locationId].name ?? "",
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [locationIds, names]
  );

  return {
    locations,
    isLoading: assetsLoading || namesLoading,
    isError: assetsError || namesError,
  };
}
