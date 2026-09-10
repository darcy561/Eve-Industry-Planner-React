import { useMemo } from "react";

import { useEffectiveMarketHubFromLayout } from "../../../../../../Hooks/Planner/useEffectiveMarketHubFromLayout.js";
import { calculateMaterialCostFromChildJobs } from "../../../../../../Functions/Groups/materialCostFromChildJobs.js";
import checkJobTypeIsBuildable from "../../../../../../Functions/Helper/checkJobTypeIsBuildable.js";
import {
  getEffectiveMaterialPriceHub,
  materialCostByBasis,
} from "../../../../../../Functions/MarketData/materialPricing.js";
import {
  buildMaterialSourcingRow,
  summariseSourcing,
} from "../../../../../../Functions/MarketData/materialSourcingRow.js";
import { getMarketPriceForType } from "../Material Prices/marketPriceHelpers";
import { resolveMaterialChildJobs } from "../Material Prices/Helpers/materialChildJobs";

/**
 * What Materials & Sourcing draws: a row per material, the figures the panel
 * states around them, and what each pricing basis would do to the total.
 *
 * The panel that this replaces resolved a price, walked child jobs and totalled
 * the result inside its row components, so a figure could only be checked by
 * rendering one. Here the job produces rows and the panel draws them.
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

      const quantity = quantityFor(activeJob, material, displayType);

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
          childJobIDs,
          childJobs: matchedChildJobs,
          resolved,
        }),
        isBuildable: checkJobTypeIsBuildable(material.jobType),
        isLinked: hasChildJobs,
        matchedChildJobs,
        marketSelect: resolved.marketSelect,
        listingSelect: resolved.listingSelect,
      });
    });

    return {
      rows,
      summary: summariseSourcing(rows),
      marketSelect,
      listingSelect,
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
    marketSelect,
    state.parentChildToEdit.childJobs,
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
 * The retiring Raw Resources panel let a player see the whole job's requirement
 * or only the selected setup's, and that choice comes with it.
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
