import {
  BLUEPRINT_SCOPE,
  getCachedBlueprintIndex,
} from "../../Hooks/EveEsi/useBlueprintIndex";

/**
 * Whether a blueprint is an original or a copy.
 *
 * An id naming nothing the account holds reads as a copy, which is what the callers want: a job
 * built from a blueprint that is not there is not built from an original.
 *
 * @param {number | undefined | null} blueprintID - the blueprint's `item_id`
 * @param {import("@tanstack/react-query").QueryClient} queryClient
 * @returns {"bp" | "bpc"}
 */
export default function findBlueprintType(blueprintID, queryClient) {
  if (!blueprintID) return "bpc";

  const { byItemId } = getCachedBlueprintIndex(queryClient, {
    scope: BLUEPRINT_SCOPE.ALL,
  });

  return byItemId.get(blueprintID)?.isCopy === false ? "bp" : "bpc";
}
