import { useMemo } from "react";
import { Grid, Typography } from "@mui/material";
import { AvailableChildJobs_Purchasing } from "./availableChildJobs";
import { ExistingChildJobs_Purchasing } from "./existingChildJobs";
import getCurrentLinkedChildJobIDsForMaterial from "../Material Cards/functions/getCurrentLinkedChildJobIDsForMaterial.js";
import useUsersStore from "../../../../../../Zustand/usersStore";
import { useSiblingLinkLock } from "../../../../Edit Job Hooks/useActiveJobDocumentLock";

/**
 * The child jobs linked to a material and the ones that could be, as the body of
 * a dialogue. Mounted only while that dialogue is open, so the pass over the
 * planner's jobs costs nothing while nobody is looking at it.
 *
 * @param {Object} props
 * @param {Object} props.state - Edit Job reducer state
 * @param {Object} props.actions - Edit Job reducer actions
 * @param {Object} props.material - The material this card is for
 */
export function ChildJobLinks(props) {
  const { state, material } = props;
  const { jobArray } = useUsersStore((rootState) => rootState.jobData);
  /**
   * Computed once at the dialogue level and broadcast through `{...props}` so the
   * Add/Clear row buttons share the same reactive lock subscription instead of
   * each row re-running the selector chain.
   */
  const siblingLinkLock = useSiblingLinkLock(state);

  /* Linking waits in the pending changes rather than being written to the job,
   * so both lists have to follow those as well as the job itself. */
  const existingChildJobs = useMemo(
    () =>
      getCurrentLinkedChildJobIDsForMaterial(
        material.typeID,
        state.activeJob,
        state.temporaryChildJobs,
        state.parentChildToEdit,
      ),
    [
      material.typeID,
      state.activeJob,
      state.temporaryChildJobs,
      state.parentChildToEdit,
    ],
  );

  const availableChildJobs = useMemo(
    () =>
      jobArray.filter(
        (job) =>
          job.itemID === material.typeID &&
          !existingChildJobs.includes(job.jobID) &&
          (!state.activeJob.includedInGroup ||
            job.groupID === state.activeJob.groupID),
      ),
    [state.activeJob, jobArray, material.typeID, existingChildJobs],
  );

  return (
    <>
      <AvailableChildJobs_Purchasing
        {...props}
        availableChildJobs={availableChildJobs}
        siblingLinkLock={siblingLinkLock}
      />
      <Grid sx={{ marginBottom: "10px" }}>
        <Typography variant="h6" color="primary" align="center">
          Linked Child Jobs
        </Typography>
      </Grid>
      <ExistingChildJobs_Purchasing
        {...props}
        existingChildJobs={existingChildJobs}
        siblingLinkLock={siblingLinkLock}
      />
    </>
  );
}
