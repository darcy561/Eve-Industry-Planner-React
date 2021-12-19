import {
  Container,
  Grid,
  Icon,
  IconButton,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useContext } from "react";
import { ActiveJobContext } from "../../../../../Context/JobContext";
import { useCreateJobProcess } from "../../../../../Hooks/useCreateJob";
import { MdOutlineAddCircle, MdRemoveCircle } from "react-icons/md";

export function RawResourceList() {
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const { newJobProcess } = useCreateJobProcess();

  function AddBuildIcon({ material }) {
    if (material.jobType === 1) {
      return (
        <Tooltip
          title="Manufacturing Job, click to create as a new job."
          placement="left-start"
        >
          <IconButton
            sx={{ color: "manufacturing.main" }}
            size="small"
            onClick={() => newJobProcess(material.typeID, material.quantity)}
          >
            <MdOutlineAddCircle />
          </IconButton>
        </Tooltip>
      );
    } else if (material.jobType === 2) {
      return (
        <Tooltip
          title="Reaction Job, click to create as a new job"
          placement="left-start"
        >
          <IconButton
            sx={{ color: "reaction.main" }}
            size="small"
            onClick={() => newJobProcess(material.typeID, material.quantity)}
          >
            <MdOutlineAddCircle />
          </IconButton>
        </Tooltip>
      );
    } else if (material.jobType === 3) {
      return (
        <Tooltip title="Planetary Interaction" placement="left-start">
          <IconButton sx={{ color: "pi.main" }} fontSize="small">
            <MdRemoveCircle />
          </IconButton>
        </Tooltip>
      );
    } else if (material.jobType === 0) {
      return (
        <Tooltip title="Base Material" placement="left-start">
          <IconButton size="small" sx={{ color: "baseMat.main" }}>
            <MdRemoveCircle />
          </IconButton>
        </Tooltip>
      );
    }
  }

  return (
    <Paper
      sx={{
        padding: "20px",
        margin: "10px",
      }}
      elevation={3}
      square={true}
    >
      <Container disableGutters={false}>
        <Typography variant="h4" color="primary" align="center" gutterBottom={true}>
          Raw Resources
        </Typography>
        <Grid container direction="column">
          {activeJob.job.materials.map((material) => {
            return (
              <Grid
                key={material.typeID}
                item
                container
                direction="row"
                style={{ width: "100%" }}
              >
                <Grid item style={{ width: "10%" }}>
                  <AddBuildIcon material={material} />
                </Grid>
                <Grid item style={{ width: "80%" }}>
                  <Typography variant="body1">{material.name}</Typography>
                </Grid>
                <Grid item style={{ width: "10%" }}>
                  <Typography variant="body1" align="right">
                    {material.quantity.toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </Paper>
  );
}
