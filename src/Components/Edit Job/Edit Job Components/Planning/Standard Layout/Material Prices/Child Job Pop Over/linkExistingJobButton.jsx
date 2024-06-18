import { Button } from "@mui/material";
import { useManageGroupJobs } from "../../../../../../../Hooks/GroupHooks/useManageGroupJobs";
import { useHelperFunction } from "../../../../../../../Hooks/GeneralHooks/useHelperFunctions";

export function LinkExistingGroupJobButton_ChildJobPopoverFrame({
  activeJob,
  updateActiveJob,
  material,
  setJobModified,
  parentChildToEdit,
  updateParentChildToEdit,
}) {
  const { findJobIDOfMaterialFromGroup } = useManageGroupJobs();
  const { Add_RemovePendingChildJobs } = useHelperFunction();

  function linkToGroupJob() {
    const matchedGroupJobID = findJobIDOfMaterialFromGroup(
      material.typeID,
      activeJob.groupID
    );
    if (!matchedGroupJobID) return;

    const { newChildJobstoAdd, newChildJobsToRemove } =
      Add_RemovePendingChildJobs(
        parentChildToEdit.childJobs[material.typeID],
        matchedGroupJobID,
        true
      );
    updateParentChildToEdit((prev) => ({
      ...prev,
      childJobs: {
        [material.typeID]: {
          ...prev.childJobs[material.typeID],
          add: newChildJobstoAdd,
          remove: newChildJobsToRemove,
        },
      },
    }));
    setJobModified(true);
  }

  return (
    <Button size="small" onClick={linkToGroupJob}>
      Link To Existing Group Job
    </Button>
  );
}

export function UnlinkExistingChildJobButton_ChildJobPopoverFrame({
  activeJob,
  updateActiveJob,
  material,
  setJobModified,
  parentChildToEdit,
  updateParentChildToEdit,
}) {
  const { findJobIDOfMaterialFromGroup } = useManageGroupJobs();
  const { Add_RemovePendingChildJobs } = useHelperFunction();

  function linkToGroupJob() {
    const matchedGroupJobID = findJobIDOfMaterialFromGroup(
      material.typeID,
      activeJob.groupID
    );
    if (!matchedGroupJobID) return;

    const { newChildJobstoAdd, newChildJobsToRemove } =
      Add_RemovePendingChildJobs(
        parentChildToEdit.childJobs[material.typeID],
        matchedGroupJobID,
        false
      );

    updateParentChildToEdit((prev) => ({
      ...prev,
      childJobs: {
        [material.typeID]: {
          ...prev.childJobs[material.typeID],
          add: newChildJobstoAdd,
          remove: newChildJobsToRemove,
        },
      },
    }));
    setJobModified(true);
  }

  return (
    <Button size="small" onClick={linkToGroupJob}>
      Unlink from Existing Group Job
    </Button>
  );
}
