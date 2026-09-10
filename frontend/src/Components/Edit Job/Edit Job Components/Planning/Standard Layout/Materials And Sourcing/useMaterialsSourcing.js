import { useMemo } from "react";

import { useEffectiveMarketHubFromLayout } from "../../../../../../Hooks/Planner/useEffectiveMarketHubFromLayout.js";
import { calculateMaterialCostFromChildJobs } from "../../../../../../Functions/Groups/materialCostFromChildJobs.js";
import checkJobTypeIsBuildable from "../../../../../../Functions/Helper/checkJobTypeIsBuildable.js";
import {
  getEffectiveMaterialPriceHub,
  materialCostByBasis,
  priceAge,
  summariseBasisUse,
} from "../../../../../../Functions/MarketData/materialPricing.js";
import {
  buildMaterialSourcingRow,
  summariseSourcing,
} from "../../../../../../Functions/MarketData/materialSourcingRow.js";
import { getMarketPriceForType } from "../Material Prices/marketPriceHelpers";
import {
  resolveMaterialChildJobStatus,
  resolveMaterialChildJobs,
} from "../Material Prices/Helpers/materialChildJobs";
import { materialMark } from "../../../../../../Functions/MarketData/materialMark.js";
import useUsersStore from "../../../../../../Zustand/usersStore.js";

/**
 * What Materials & Sourcing draws: a row per material, the figures the panel
 * states around them, and what each pricing basis would do to the total.
 *
 * The rows are built here rather than inside the row components, so a figure can
 * be checked without rendering one.
 *
 * @param {object} params
 * @param {object} params.state - Edit Job state
 * @param {object} params.actions - Edit Job actions
 * @param {'all'|'active'} [params.displayType] - Whether quantities are the whole
 *   job's or only the selected setup's
 */
export function useMaterialsSourcing({ state, actions, displayType = "all" }) {
  const { activeJob } = state;
  const { layout } = activeJob;
  const { marketDisplay: marketSelect, orderDisplay: listingSelect } =
    useEffectiveMarketHubFromLayout(layout);

  const checkTypeIDisExempt = useUsersStore(
    (store) => store.applicationSettings.actions.checkTypeIDisExempt
  );

  return useMemo(() => {
    const materials = Array.isArray(activeJob.build?.materials)
      ? activeJob.build.materials
      : [];

    const rows = materials.map((material) => {
      const resolved = getEffectiveMaterialPriceHub(
        layout,
        material.typeID,
        marketSelect,
        listingSelect
      );
      const { childJobsById, childJobIDs, hasChildJobs } =
        resolveMaterialChildJobs({
          state,
          actions,
          materialTypeID: material.typeID,
        });
      const matchedChildJobs = Array.from(childJobsById.values());
      const { hasLinked, hasTemp, hasPendingAdd } = resolveMaterialChildJobStatus(
        {
          state,
          materialTypeID: material.typeID,
          childJobsLocation: activeJob.build.childJobs[material.typeID] || [],
        }
      );

      const quantity = quantityFor(activeJob, material, displayType);

      // A speculative job prices the row without committing it. It deliberately
      // does not count towards `isLinked`: a row that is costed but still on Buy
      // is the whole point — it is what lets the panel offer the switch.
      const speculative = hasChildJobs
        ? null
        : (state.speculativeChildJobs?.[material.typeID] ?? null);

      return buildMaterialSourcingRow({
        material,
        quantity,
        buyPrice: getMarketPriceForType(
          material.typeID,
          resolved.marketSelect,
          resolved.listingSelect
        ),
        buildPrice: unitBuildCost({
          material,
          childJobIDs: speculative ? [speculative.jobID] : childJobIDs,
          childJobs: speculative ? [speculative] : matchedChildJobs,
          resolved,
        }),
        isSpeculative: Boolean(speculative),
        isBuildable: checkJobTypeIsBuildable(material.jobType),
        isLinked: hasChildJobs,
        matchedChildJobs,
        mark: materialMark({
          jobType: material.jobType,
          hasLinked,
          hasPending: hasTemp || hasPendingAdd,
          isExempt: checkTypeIDisExempt(material.typeID),
        }),
        marketSelect: resolved.marketSelect,
        listingSelect: resolved.listingSelect,
      });
    });

    return {
      rows,
      summary: summariseSourcing(rows),
      marketSelect,
      listingSelect,
      basisUsage: summariseBasisUse(rows, marketSelect, listingSelect),
      priceAge: priceAge(
        materials,
        useUsersStore.getState().worldData.actions.findMarketData,
      ),
      basisOptions: materialCostByBasis({
        materials,
        layout,
        marketSelect,
        listingSelect,
        getPrice: getMarketPriceForType,
      }),
    };
    // The reducer returns a new state object on every dispatch anywhere on the
    // page, so this lists the parts the rows are actually built from.
  }, [
    actions,
    activeJob,
    displayType,
    layout,
    listingSelect,
    checkTypeIDisExempt,
    marketSelect,
    state.parentChildToEdit.childJobs,
    state.speculativeChildJobs,
    state.temporaryChildJobs,
  ]);
}

/**
 * What building one of a material costs, or null when nothing is linked to say.
 *
 * @param {object} params
 * @returns {number|null}
 */
function unitBuildCost({ material, childJobIDs, childJobs, resolved }) {
  if (childJobIDs.length === 0) return null;

  const total = calculateMaterialCostFromChildJobs(
    material,
    childJobIDs,
    childJobs,
    [],
    resolved.marketSelect,
    resolved.listingSelect
  );

  const quantity = material.quantity;
  if (!quantity) return null;

  return total / quantity;
}

/**
 * How many the row states.
 *
 * A player can read the whole job's requirement or only the selected setup's,
 * which are different figures on a job with more than one setup.
 *
 * @param {object} activeJob
 * @param {object} material
 * @param {'all'|'active'} displayType
 * @returns {number}
 */
function quantityFor(activeJob, material, displayType) {
  if (displayType !== "active") return material.quantity;

  return (
    activeJob.selectedSetup?.materialCount?.[material.typeID]?.quantity ??
    material.quantity
  );
}
