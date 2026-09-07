/**
 * Planner settings actions: reading a planner's settings and holding them per
 * owner.
 */

import { fetchPlannerSettingsFromApi } from "../../Functions/Endpoints/Private/planners.js";
import { mergePlannerSettings, plannerSettingsDefault } from "./core.js";

export const plannerSettingsActions = (set, get) => ({
  /**
   * The settings held for one planner, or the defaults when none are.
   *
   * @param {string} ownerHandle
   * @returns {object}
   */
  getPlannerSettings: (ownerHandle) =>
    get().plannerSettings.byOwner[ownerHandle] ?? plannerSettingsDefault(),

  /**
   * Whether the planner has settings of its own rather than falling back.
   *
   * @param {string} ownerHandle
   * @returns {boolean}
   */
  isPlannerSeeded: (ownerHandle) =>
    get().plannerSettings.seededByOwner[ownerHandle] ?? false,

  /**
   * The extras categories a planner offers, deleted ones removed.
   *
   * @param {string} ownerHandle
   * @returns {{id: string, name: string}[]}
   */
  getPlannerExtrasCategories: (ownerHandle) => {
    const settings = get().plannerSettings.actions.getPlannerSettings(ownerHandle);
    return (settings.extrasCategories ?? []).filter((entry) => !entry?.deleted);
  },

  /**
   * @param {string} ownerHandle
   * @param {object} settings - the `settings` object from the API
   * @param {boolean} seeded
   */
  setPlannerSettings: (ownerHandle, settings, seeded) => {
    if (!ownerHandle) return;
    set(
      (state) => ({
        ...state,
        plannerSettings: {
          ...state.plannerSettings,
          byOwner: {
            ...state.plannerSettings.byOwner,
            [ownerHandle]: mergePlannerSettings(settings),
          },
          seededByOwner: {
            ...state.plannerSettings.seededByOwner,
            [ownerHandle]: !!seeded,
          },
          actions: state.plannerSettings.actions,
        },
      }),
      false,
      "plannerSettings/setPlannerSettings"
    );
  },

  /**
   * Reads one planner's settings from the API and holds them.
   *
   * @param {string} ownerHandle
   * @returns {Promise<object|null>} the merged settings, or null if the read failed
   */
  loadPlannerSettings: async (ownerHandle) => {
    if (!ownerHandle) return null;
    try {
      const response = await fetchPlannerSettingsFromApi(ownerHandle);
      get().plannerSettings.actions.setPlannerSettings(
        ownerHandle,
        response?.settings,
        response?.seeded
      );
      return get().plannerSettings.byOwner[ownerHandle] ?? null;
    } catch (e) {
      console.error("[plannerSettings] read failed", ownerHandle, e);
      return null;
    }
  },

  /** Drops every planner's settings, for a sign-out. */
  clearPlannerSettings: () => {
    set(
      (state) => ({
        ...state,
        plannerSettings: {
          ...state.plannerSettings,
          byOwner: {},
          seededByOwner: {},
          actions: state.plannerSettings.actions,
        },
      }),
      false,
      "plannerSettings/clearPlannerSettings"
    );
  },
});
