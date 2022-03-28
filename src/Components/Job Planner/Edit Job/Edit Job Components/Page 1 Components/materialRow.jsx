import { useContext, useState } from "react";
import { ActiveJobContext } from "../../../../../Context/JobContext";
import { useJobManagement } from "../../../../../Hooks/useJobManagement";
import {
  CircularProgress,
  Grid,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import { MdOutlineAddCircle, MdRemoveCircle } from "react-icons/md";
import { jobTypes } from "../../..";

export function MaterialRow({ material }) {
  const { activeJob } = useContext(ActiveJobContext);
  const { newJobProcess, updateJobSnapshot } = useJobManagement();
  const [addJob, updateAddJob] = useState(false);

  async function handleAdd() {
    updateAddJob(true);
    let newJob = await newJobProcess(material.typeID, material.quantity, [
      activeJob,
    ]);
    const index = activeJob.build.materials.findIndex(
      (i) => i.typeID === newJob.itemID
    );
    activeJob.build.materials[index].childJob.push(newJob.jobID);
    updateJobSnapshot(activeJob);
    updateAddJob(false);
  }

  return (
    <Grid item container direction="row">
      <Grid item xs={2} sm={1} align="center">
        {addJob ? (
          <CircularProgress color="primary" />
        ) : (
          <Tooltip
            title={
              material.jobType === jobTypes.manufacturing
                ? "Manufacturing Job, click to create a new child job."
                : material.jobType === jobTypes.reaction
                ? "Reaction Job, click to create a new child job"
                : material.jobType === jobTypes.pi
                ? "Planetary Interaction"
                : "Base Material"
            }
            placement="left-start"
            arrow
          >
            <IconButton
              onClick={() => {
                if (
                  material.jobType === jobTypes.manufacturing ||
                  material.jobType === jobTypes.reaction
                ) {
                  handleAdd();
                }
              }}
              size="small"
              disableRipple={
                material.jobType === jobTypes.manufacturing ||
                material.jobType === jobTypes.reaction
                  ? false
                  : true
              }
              sx={{
                color:
                  material.jobType === jobTypes.manufacturing
                    ? "manufacturing.main"
                    : material.jobType === jobTypes.reaction
                    ? "reaction.main"
                    : material.jobType === jobTypes.pi
                    ? "pi.main"
                    : "baseMat.main",
              }}
            >
              {material.jobType === jobTypes.manufacturing ||
              material.jobType === jobTypes.reaction ? (
                <MdOutlineAddCircle />
              ) : (
                <MdRemoveCircle />
              )}
            </IconButton>
          </Tooltip>
        )}
      </Grid>
      <Grid item xs={7} sm={7}>
        <Typography sx={{ typography:{xs:"body2", sm:"body1"}}}>{material.name}</Typography>
      </Grid>
      <Grid item xs={3} sm={4} align="right">
        <Typography sx={{ typography:{xs:"body2", sm:"body1"}}}>
          {material.quantity.toLocaleString()}
        </Typography>
      </Grid>
    </Grid>
  );
}
