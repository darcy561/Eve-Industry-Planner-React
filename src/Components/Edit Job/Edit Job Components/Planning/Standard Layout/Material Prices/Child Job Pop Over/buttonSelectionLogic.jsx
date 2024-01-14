import {
  CancelCreateChildJobButton_ChildJobPopoverFrame,
  CreateChildJobButton_ChildJobPopoverFrame,
} from "./createJobsButton";
import {
  LinkExistingGroupJobButton_ChildJobPopoverFrame,
  UnlinkExistingChildJobButton_ChildJobPopoverFrame,
} from "./linkExistingJobButton";
import { OpenChildJobButon_ChildJobPopoverFrame } from "./openChildJobButton";

export function ButtonSelectionLogic_ChildJobPopoverFrame({
  activeJob,
  updateActiveJob,
  material,
  jobModified,
  childJobsLocation,
  childJobObjects,
  jobDisplay,
  temporaryChildJobs,
  updateTemporaryChildJobs,
  tempPrices,
  setJobModified,
  isExistingJobInGroup,
  esiDataToLink,
  updateEsiDataToLink,
  parentChildToEdit,
  updateParentChildToEdit,
}) {
  const openChildJobButton = (
    <OpenChildJobButon_ChildJobPopoverFrame
      activeJob={activeJob}
      jobModified={jobModified}
      temporaryChildJobs={temporaryChildJobs}
      esiDataToLink={esiDataToLink}
      parentChildToEdit={parentChildToEdit}
      childJobObjects={childJobObjects}
      jobDisplay={jobDisplay}
    />
  );
  const createChildJobButton = (
    <CreateChildJobButton_ChildJobPopoverFrame
      childJobObjects={childJobObjects}
      jobDisplay={jobDisplay}
      updateTemporaryChildJobs={updateTemporaryChildJobs}
      tempPrices={tempPrices}
      setJobModified={setJobModified}
    />
  );
  const cancelCreateChildJobButton = (
    <CancelCreateChildJobButton_ChildJobPopoverFrame
      childJobObjects={childJobObjects}
      jobDisplay={jobDisplay}
      temporaryChildJobs={temporaryChildJobs}
      updateTemporaryChildJobs={updateTemporaryChildJobs}
      tempPrices={tempPrices}
      setJobModified={setJobModified}
    />
  );

  const linkExistingGroupJobButton = (
    <LinkExistingGroupJobButton_ChildJobPopoverFrame
      activeJob={activeJob}
      updateActiveJob={updateActiveJob}
      material={material}
      setJobModified={setJobModified}
      esiDataToLink={esiDataToLink}
      updateEsiDataToLink={updateEsiDataToLink}
      parentChildToEdit={parentChildToEdit}
      updateParentChildToEdit={updateParentChildToEdit}
    />
  );

  const unlinkExistingGroupJobButton = (
    <UnlinkExistingChildJobButton_ChildJobPopoverFrame
      activeJob={activeJob}
      updateActiveJob={updateActiveJob}
      material={material}
      setJobModified={setJobModified}
      esiDataToLink={esiDataToLink}
      updateEsiDataToLink={updateEsiDataToLink}
      parentChildToEdit={parentChildToEdit}
      updateParentChildToEdit={updateParentChildToEdit}
    />
  );

  if (activeJob.groupID) {
    if (childJobsLocation.length === 0) {
      if (!temporaryChildJobs[material.typeID]) {
        if (
          !parentChildToEdit.childJobs[material.typeID]?.add ||
          parentChildToEdit.childJobs[material.typeID]?.add.length === 0
        ) {
          if (!isExistingJobInGroup.current) {
            return createChildJobButton;
          } else {
            return linkExistingGroupJobButton;
          }
        } else {
          if (!isExistingJobInGroup) {
            return openChildJobButton;
          } else {
            return unlinkExistingGroupJobButton;
          }
        }
      } else {
        return cancelCreateChildJobButton;
      }
    } else {
      return openChildJobButton;
    }
  } else {
    if (childJobsLocation.length === 0) {
      if (!temporaryChildJobs[material.typeID]) {
        if (
          !parentChildToEdit.childJobs[material.typeID]?.add ||
          parentChildToEdit.childJobs[material.typeID]?.add.length === 0
        ) {
          return createChildJobButton;
        } else {
          return openChildJobButton;
        }
      } else {
        return cancelCreateChildJobButton;
      }
    } else {
      return openChildJobButton;
    }
  }
}
