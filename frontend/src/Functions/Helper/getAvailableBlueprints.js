import {
  BLUEPRINT_SCOPE,
  getCachedBlueprintIndex,
} from "../../Hooks/EveEsi/useBlueprintIndex";

/**
 * The items the account's blueprints can produce.
 *
 * Synchronous, where it used to await the search index: what a blueprint builds is resolved onto
 * the row when the collection is built, so there is no join left to perform here.
 *
 * @param {import("@tanstack/react-query").QueryClient} queryClient
 * @returns {Set<number>} produced `type_id`s
 */
function getAvailableBlueprintsByMaterialID(queryClient) {
  const { rows } = getCachedBlueprintIndex(queryClient, {
    scope: BLUEPRINT_SCOPE.ALL,
  });

  const producible = new Set();
  for (const { productTypeId } of rows) {
    if (productTypeId != null) producible.add(productTypeId);
  }
  return producible;
}

export { getAvailableBlueprintsByMaterialID };
