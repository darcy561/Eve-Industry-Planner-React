import { useContext, useEffect, useMemo, useState } from "react";
import { JobArrayContext } from "../../../../../../Context/JobContext";
import { UserJobSnapshotContext } from "../../../../../../Context/AuthContext";
import { useFirebase } from "../../../../../../Hooks/useFirebase";
import { Popover } from "@mui/material";

export function ChildJobPopover({
  activeJob,
  updateActiveJob,
  displayPopover,
  updateDisplayPopover,
  material,
  marketSelect,
  listingSelect,
  jobModified,
  setJobModified,
  currentBuildPrice,
  updateCurrentBuildPrice,
  currentPurchasePrice,
  materialIndex,
}) {
  const { jobArray } = useContext(JobArrayContext);
  const { userJobSnapshot } = useContext(UserJobSnapshotContext);

  const { downloadCharacterJobs } = useFirebase();

  useEffect(() => {
    async function fetchData() {
      if (!displayPopover) return;
      const childJobLocation = activeJob.build.childJobs[material.typeID];
      const jobs = [];

      if (childJobLocation.length > 0) {
        for (let id of childJobLocation) {
        }
      }
    }
  }, [displayPopover]);

  return (
    <Popover
      id={material.typeID}
      open={Boolean(displayPopover)}
      anchorEl={displayPopover}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      onClose={() => {
        updateDisplayPopover(null);
        updateActiveJob((prev) => ({
          ...prev,
          layout: {
            ...prev.layout,
            childJobPopOverID: null,
          },
        }));
      }}
    >
      "fff"
    </Popover>
  );

  function isPopOverOpen(materialID, childJobPopOverID, displayPopover) {
    if (Boolean(displayPopover)) return true;

    if (childJobPopOverID && materialID === childJobPopOverID) return true;

    return false;
  }
}
