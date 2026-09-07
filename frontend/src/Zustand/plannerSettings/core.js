/**
 * Planner settings state — aligned with Go `planner.Settings` JSON.
 *
 * Held per owner handle: the archive and the switcher both reach planners that
 * are not the active one.
 */

import {
  DEFAULT_REPROCESSING_CALCULATION_SETTINGS,
  extrasCategoriesDefault,
} from "../../Context/defaultValues";

/**
 * The settings a planner falls back to before its document has been read.
 *
 * @returns {object}
 */
export const plannerSettingsDefault = () => ({
  customStructures: {
    manufacturing: [],
    reaction: [],
    reprocessing: [],
    invention: [],
  },
  defaultMaterialEfficiencyValue: 0,
  predefinedSystemIndexes: {},
  extrasCategories: extrasCategoriesDefault,
  defaultCitadelBrokersFee: 1,
  reprocessingSettings: {
    defaultReprocessingCharacter: null,
    ...DEFAULT_REPROCESSING_CALCULATION_SETTINGS,
  },
  exemptTypeIDs: [],
});

/**
 * @returns {object} Default planner settings slice state
 */
export const stateDefault = () => ({
  /** @type {Object<string, object>} owner handle -> that planner's settings */
  byOwner: {},
  /** @type {Object<string, boolean>} owner handle -> whether the planner has settings of its own */
  seededByOwner: {},
});

/**
 * Server payload merged onto the defaults, so an omitted field reads as its
 * default rather than as undefined.
 *
 * @param {object} incoming - the `settings` object from the API
 * @returns {object}
 */
export function mergePlannerSettings(incoming) {
  const base = plannerSettingsDefault();
  if (!incoming || typeof incoming !== "object") return base;

  return {
    ...base,
    ...incoming,
    customStructures: {
      ...base.customStructures,
      ...(incoming.customStructures ?? {}),
    },
    reprocessingSettings: {
      ...base.reprocessingSettings,
      ...(incoming.reprocessingSettings ?? {}),
    },
    extrasCategories: Array.isArray(incoming.extrasCategories)
      ? incoming.extrasCategories
      : base.extrasCategories,
    predefinedSystemIndexes: incoming.predefinedSystemIndexes ?? {},
    exemptTypeIDs: Array.isArray(incoming.exemptTypeIDs)
      ? incoming.exemptTypeIDs
      : [],
  };
}
