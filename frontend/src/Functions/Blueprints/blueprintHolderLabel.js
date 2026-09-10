import { ownerName } from "../Shared/eveOwner";

/**
 * Who holds a blueprint and where, as the library labels it.
 *
 * The location is absent until the assets covering that blueprint have arrived, which is what
 * resolves a raw holder id into a place.
 *
 * @param {import("./buildBlueprintRows").BlueprintRow} blueprint
 * @param {string} [locationName]
 * @returns {string}
 */
export default function blueprintHolderLabel(blueprint, locationName) {
  const owner = ownerName({
    kind: blueprint.ownerType,
    id: blueprint.ownerId,
  });

  return [owner || "unknown", locationName].filter(Boolean).join(" \u2014 ");
}

/**
 * A blueprint row's holder as the shared owner reference.
 *
 * @param {import("./buildBlueprintRows").BlueprintRow} blueprint
 * @returns {import("../Shared/eveOwner").EveOwner}
 */
export function blueprintOwner(blueprint) {
  return { kind: blueprint.ownerType, id: blueprint.ownerId };
}
