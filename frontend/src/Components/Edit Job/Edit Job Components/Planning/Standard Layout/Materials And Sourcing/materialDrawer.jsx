import { Collapse, Stack, Typography } from "@mui/material";

import InsetSurface from "../../../../../../Styled Components/Paper/InsetSurface";
import { calculateChildJobTotals } from "../../../../../../Functions/Groups/childJobTotals";
import useUsersStore from "../../../../../../Zustand/usersStore";
import { ChildJobMaterials_ChildJobPopoverFrame } from "./Child Job Drawer/childJobMaterials";
import { ChildJobMaterialTotalCosts_ChildJobPopoverFrame } from "./Child Job Drawer/childJobTotalCosts";
import { ChildJobSwitcher_ChildJobPopoverFrame } from "./Child Job Drawer/switchChildJob";
import { DisplayMismatchedChildTotals_ChildJobPopoverFrame } from "./Child Job Drawer/misMatchedTotals";
import { OpenChildJobButon_ChildJobPopoverFrame } from "./Child Job Drawer/openChildJobButton";
import PlanChip from "./planChip";
import { ImportingStateLayout_ChildJobPopoverFrame } from "./Child Job Drawer/fetchState";
import { useChildJobBuildActions } from "./Hooks/useChildJobBuildActions";
import { useChildJobPopoverData } from "./Hooks/useChildJobPopoverData";
import RowPricingOverride from "./rowPricingOverride";

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
 * @param {object} [props.pricing] - Where this row is priced, and how to change it
 */
export default function MaterialDrawer({
  isOpen,
  material,
  state,
  actions,
  currentMaterialPrice,
  matchedChildJobs,
  marketSelect,
  listingSelect,
  pricing,
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

  // The totals follow whichever child job is on show, so they are worked out
  // here rather than handed in with the row.
  const totals = calculateChildJobTotals(
    childJobObjects[jobDisplay],
    state.temporaryChildJobs,
    marketSelect,
    listingSelect
  );

  const shared = {
    ...rest,
    state,
    actions,
    material,
    matchedChildJobs,
    marketSelect,
    listingSelect,
  };

  return (
    <Collapse in={isOpen} timeout="auto" unmountOnExit>
      <InsetSurface sx={{ my: 1 }}>
        {jobImportState ? (
          <Stack spacing={1.5}>
            {pricing ? (
              <RowPricingOverride typeID={material.typeID} {...pricing} />
            ) : null}

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
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              justifyContent="space-between"
              flexWrap="wrap"
            >
              <PlanChip
                state={state}
                actions={actions}
                material={material}
                rowJob={
                  state.speculativeChildJobs?.[material.typeID] ??
                  childJobObjects.find((j) => j.itemID === material.typeID) ??
                  null
                }
              />
              {childJobObjects[jobDisplay] ? (
                <OpenChildJobButon_ChildJobPopoverFrame
                  {...shared}
                  childJobObjects={childJobObjects}
                  jobDisplay={jobDisplay}
                />
              ) : null}
            </Stack>
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
