import { Button, Chip, Stack, Tooltip } from "@mui/material";

import { findMaterialJobInGroup } from "../../../../../../Functions/Groups/findMaterialJobInGroup";
import { finaliseCreatedChildJobs } from "./Helpers/finaliseCreatedChildJobs";
import { resolveMaterialChildJobStatus } from "../Material Prices/Helpers/materialChildJobs";
import {
  useActiveGroupReadOnly,
  useSiblingLinkLock,
} from "../../../../Edit Job Hooks/useActiveJobDocumentLock";
import { LockGatedTooltip, lockReasonText } from "../../../../../DocumentLock/LockGatedTooltip";
import { trackNewJobsCreated } from "../../../../../../analytics/trackNewJobsCreated";

/**
 * Whether the row is bought or built, as one decision.
 *
 * Whether confirming creates a job or links the group's existing one is not a
 * question the player asked — the decision they are making is the same either
 * way. So it is one control with two states and a way back, and which of the two
 * mechanisms fires is worked out here.
 *
 * @param {object} props
 * @param {object} props.state - Edit Job state
 * @param {object} props.actions - Edit Job actions
 * @param {object} props.material
 * @param {object|null} [props.rowJob] - The job behind this row: the one costed
 *   for it, or the real one already linked to it
 */
export default function PlanChip({ state, actions, material, rowJob }) {
  const groupReadOnly = useActiveGroupReadOnly(state);
  const siblingLock = useSiblingLinkLock(state);

  const { hasLinked, hasTemp, hasPendingAdd, tempJob } =
    resolveMaterialChildJobStatus({
      state,
      materialTypeID: material.typeID,
      childJobsLocation: state.activeJob.build.childJobs[material.typeID] ?? [],
    });

  const groupJob = state.activeJob.includedInGroup
    ? findMaterialJobInGroup(material.typeID, state.activeJob.groupID)
    : null;

  const onBuild = hasLinked || hasTemp || hasPendingAdd;

  // Linking a sibling and creating a new child are gated differently, and which
  // one confirming does depends on whether the group already builds this.
  const promoteLock = groupJob
    ? { readOnly: siblingLock.readOnly, reason: siblingLock.reason }
    : {
        readOnly: groupReadOnly,
        reason: lockReasonText({
          scope: "group",
          action: "new child jobs can't be added",
        }),
      };

  const promote = async () => {
    const job = groupJob ?? rowJob;
    if (!job) return;

    await finaliseCreatedChildJobs({
      jobsForMissingDataAndRecalc: groupJob ? [] : job,
      jobsToMarkForAddition: job,
      actions,
    });

    if (!groupJob) trackNewJobsCreated(job);
  };

  const undo = () => {
    // Whatever was committed is what has to come back out: a job marked this
    // session, a linked sibling, or a child linked before this one was opened.
    const job = tempJob ?? groupJob ?? rowJob;
    if (!job) return;
    actions.markChildJobsForRemoval(job);
  };

  if (onBuild) {
    return (
      <Stack direction="row" spacing={1} alignItems="center">
        <Chip label="Build" size="small" color="primary" />
        {/* Severing a link is the sibling lock's business wherever it happens,
            group or not — the same gate the Purchasing stage's unlink uses. */}
        <LockGatedTooltip
          readOnly={siblingLock.readOnly}
          reason={siblingLock.reason}
        >
          <Button
            size="small"
            onClick={undo}
            disabled={siblingLock.readOnly || !(tempJob ?? groupJob ?? rowJob)}
          >
            Buy instead
          </Button>
        </LockGatedTooltip>
      </Stack>
    );
  }

  const nothingToPromote = !groupJob && !rowJob;

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Chip label="Buy" size="small" variant="outlined" />
      <LockGatedTooltip readOnly={promoteLock.readOnly} reason={promoteLock.reason}>
        <Tooltip
          title={
            nothingToPromote
              ? "Cost this row first to see what building it would take"
              : ""
          }
          arrow
          placement="top"
        >
          <span>
            <Button
              size="small"
              onClick={promote}
              disabled={promoteLock.readOnly || nothingToPromote}
            >
              {groupJob ? "Build in this group" : "Build it"}
            </Button>
          </span>
        </Tooltip>
      </LockGatedTooltip>
    </Stack>
  );
}
