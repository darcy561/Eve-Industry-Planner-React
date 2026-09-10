import { Collapse, Stack, Typography } from "@mui/material";

import InsetSurface from "../../../../../../Styled Components/Paper/InsetSurface";
import useUsersStore from "../../../../../../Zustand/usersStore";
import { ChildJobMaterials_ChildJobPopoverFrame } from "../Material Prices/Child Job Pop Over/childJobMaterials";
import { ChildJobMaterialTotalCosts_ChildJobPopoverFrame } from "../Material Prices/Child Job Pop Over/childJobTotalCosts";
import { ChildJobSwitcher_ChildJobPopoverFrame } from "../Material Prices/Child Job Pop Over/switchChildJob";
import { DisplayMismatchedChildTotals_ChildJobPopoverFrame } from "../Material Prices/Child Job Pop Over/misMatchedTotals";
import { ButtonSelectionLogic_ChildJobPopoverFrame } from "../Material Prices/Child Job Pop Over/buttonSelectionLogic";
import { ImportingStateLayout_ChildJobPopoverFrame } from "../Material Prices/Child Job Pop Over/fetchState";
import { useChildJobBuildActions } from "../Material Prices/Hooks/useChildJobBuildActions";
import { useChildJobPopoverData } from "../Material Prices/Hooks/useChildJobPopoverData";

/**
 * What building a material would involve, opened from its row.
 *
 * The same comparison the centre-screen popover held, on the row it belongs to:
 * more than one can be open at once, it stays with its row while the list
 * scrolls, and the actions have room to say what they do.
 *
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {object} props.material
 * @param {object} props.state - Edit Job state
 * @param {object} props.actions - Edit Job actions
 * @param {string} props.marketSelect
 * @param {string} props.listingSelect
 * @param {number} props.currentMaterialPrice
 * @param {Array<object>} props.matchedChildJobs
 * @param {{totalCostOfMaterials: number, totalInstallCosts: number, totalCostPerItem: number, quantityProduced: number}} props.totals
 */
export default function MaterialDrawer({
  isOpen,
  material,
  state,
  actions,
  currentMaterialPrice,
  matchedChildJobs,
  totals,
  ...rest
}) {
  const checkTypeIDisExempt = useUsersStore(
    (store) => store.applicationSettings.actions.checkTypeIDisExempt
  );
  const { buildSingleChildJobPreview } = useChildJobBuildActions({
    state,
    actions,
  });

  const childJobsLocation =
    state.activeJob.build.childJobs[material.typeID] || [];

  const {
    jobImportState,
    jobDisplay,
    setJobDisplay,
    childJobObjects,
    fetchError,
    isExistingJobInGroup,
  } = useChildJobPopoverData({
    state,
    isOpen,
    material,
    matchedChildJobs,
    childJobsLocation,
    buildSingleChildJobPreview,
  });

  const shared = { ...rest, state, actions, material, matchedChildJobs };

  return (
    <Collapse in={isOpen} timeout="auto" unmountOnExit>
      <InsetSurface sx={{ my: 1 }}>
        {jobImportState ? (
          <Stack spacing={1.5}>
            {checkTypeIDisExempt(material.typeID) ? (
              <Typography variant="body2" color="warning.main">
                Marked as exempt from builds.
              </Typography>
            ) : null}

            <ChildJobMaterials_ChildJobPopoverFrame
              {...shared}
              childJobObjects={childJobObjects}
              jobDisplay={jobDisplay}
            />
            <ChildJobMaterialTotalCosts_ChildJobPopoverFrame
              currentMaterialPrice={currentMaterialPrice}
              totalCostOfMaterials={totals.totalCostOfMaterials}
              totalInstallCosts={totals.totalInstallCosts}
              totalCostPerItem={totals.totalCostPerItem}
            />
            <DisplayMismatchedChildTotals_ChildJobPopoverFrame
              materialQuantity={material?.quantity || 0}
              totalItemsProduced={totals.quantityProduced}
              totalCostPerItem={totals.totalCostPerItem}
            />
            <ChildJobSwitcher_ChildJobPopoverFrame
              childJobObjects={childJobObjects}
              jobDisplay={jobDisplay}
              setJobDisplay={setJobDisplay}
            />
            <ButtonSelectionLogic_ChildJobPopoverFrame
              {...shared}
              childJobsLocation={childJobsLocation}
              childJobObjects={childJobObjects}
              jobDisplay={jobDisplay}
              isExistingJobInGroup={isExistingJobInGroup}
            />
          </Stack>
        ) : (
          <ImportingStateLayout_ChildJobPopoverFrame
            fetchError={fetchError}
            material={material}
          />
        )}
      </InsetSurface>
    </Collapse>
  );
}
