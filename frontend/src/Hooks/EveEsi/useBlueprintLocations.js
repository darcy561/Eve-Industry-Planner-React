import { useMemo } from "react";
import useAssetIndex, { ASSET_SCOPE } from "./useAssetIndex";
import useLocationNames from "./useLocationNames";
import blueprintLocations from "../../Functions/Blueprints/blueprintLocations";

const EMPTY_NAMES = new Map();

/**
 * What each blueprint's location is called.
 *
 * A corporation's assets are the largest thing the app fetches, and the library asks for every
 * scope's. The library holds its results back until this has settled rather than drawing labels in
 * one at a time as each scope lands.
 *
 * @param {import("../../Functions/Blueprints/buildBlueprintRows").BlueprintCollection} blueprints
 * @returns {{names: Map<number, string>, places: Array<{locationId: number, name: string}>, locationIds: Map<number, number>, isLoading: boolean, isError: boolean, error: Error|null}} names and locations keyed by blueprint `itemId`, and the distinct places in display order
 */
export default function useBlueprintLocations(blueprints) {
  const {
    data: assets,
    isLoading: assetsLoading,
    isError: assetsError,
    error: assetsErrorValue,
  } = useAssetIndex({ scope: ASSET_SCOPE.ALL });

  const locationIds = useMemo(
    () => blueprintLocations(blueprints, assets),
    [blueprints, assets],
  );

  const requested = useMemo(
    () => [...new Set(locationIds.values())],
    [locationIds],
  );
  const {
    names,
    isLoading: namesLoading,
    isError: namesError,
    error: namesErrorValue,
  } = useLocationNames(requested);

  const byItemId = useMemo(() => {
    if (locationIds.size === 0) return EMPTY_NAMES;

    const found = new Map();
    for (const [itemId, locationId] of locationIds) {
      const name = names[locationId]?.name;
      if (name) found.set(itemId, name);
    }
    return found;
  }, [locationIds, names]);

  // The places blueprints are held at, for narrowing the library to one of them.
  const places = useMemo(() => {
    const named = new Map();
    for (const locationId of locationIds.values()) {
      const name = names[locationId]?.name;
      if (name) named.set(locationId, name);
    }
    return [...named.entries()]
      .map(([locationId, name]) => ({ locationId, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [locationIds, names]);

  // A failure reads the same as a blueprint simply having no location, so it is reported rather
  // than left to look like an answer.
  return {
    names: byItemId,
    places,
    locationIds,
    isLoading: assetsLoading || namesLoading,
    isError: assetsError || namesError,
    error: assetsErrorValue ?? namesErrorValue ?? null,
  };
}
