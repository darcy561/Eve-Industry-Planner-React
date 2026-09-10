import { useQuery } from "@tanstack/react-query";
import getAssetLocationNames from "../../Functions/EveESI/World/getAssetLocationNames";

export const assetContainerNamesQueryKey = "assetContainerNames";

const EMPTY_NAMES = new Map();

/**
 * The names a player has given the containers in a set of assets.
 *
 * Access is per character — a corporation's containers are readable by a member with the roles for
 * them — so the character to ask with is the caller's to choose.
 *
 * @param {{character?: Object, scope?: string, itemIds?: number[], enabled?: boolean}} [request]
 * @returns {{names: Map<number, {name: string}>, isLoading: boolean, isError: boolean}}
 */
export default function useAssetContainerNames({
  character,
  scope = "character",
  itemIds = [],
  enabled = true,
} = {}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: [
      assetContainerNamesQueryKey,
      scope,
      character?.CharacterHash ?? null,
      itemIds,
    ],
    queryFn: () => getAssetLocationNames(character, itemIds, scope),
    enabled: enabled && Boolean(character) && itemIds.length > 0,
    // A container keeps the name its owner gave it for as long as the app is open.
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return { names: data ?? EMPTY_NAMES, isLoading, isError };
}
