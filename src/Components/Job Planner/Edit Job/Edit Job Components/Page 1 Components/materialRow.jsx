import { useContext, useState } from "react";
import {
  CircularProgress,
  Grid,
  Icon,
  Tooltip,
  Typography,
} from "@mui/material";
import { jobTypes } from "../../../../../Context/defaultValues";
import DoneIcon from "@mui/icons-material/Done";
import LensIcon from "@mui/icons-material/Lens";
import { ActiveJobContext } from "../../../../../Context/JobContext";

export function MaterialRow({ material }) {
  const { activeJob } = useContext(ActiveJobContext);
  const [addJob, updateAddJob] = useState(false);

  return (
    <Grid item container direction="row">
      <Grid item xs={2} sm={1} align="center">
        {activeJob.build.childJobs[material.typeID].length === 0 ? (
          addJob ? (
            <CircularProgress size={14} color="primary" />
          ) : (
            <Tooltip
              title={
                material.jobType === jobTypes.manufacturing
                  ? "Manufacturing Job"
                  : material.jobType === jobTypes.reaction
                  ? "Reaction Job"
                  : material.jobType === jobTypes.pi
                  ? "Planetary Interaction"
                  : "Base Material"
              }
              placement="left-start"
              arrow
            >
              <Icon
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
                <LensIcon fontSize="small" />
              </Icon>
            </Tooltip>
          )
        ) : (
          <Tooltip
            title={
              material.jobType === jobTypes.manufacturing
                ? "Manufacturing Child Job Linked."
                : "Reaction Child Job Linked."
            }
            placement="left-start"
            arrow
          >
            <Icon
              size="small"
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
              <DoneIcon size={22} />
            </Icon>
          </Tooltip>
        )}
      </Grid>
      <Grid item xs={7} sm={7}>
        <Typography sx={{ typography: { xs: "caption", sm: "body1" } }}>
          {material.name}
        </Typography>
      </Grid>
      <Grid item xs={3} sm={4} align="right">
        <Typography sx={{ typography: { xs: "caption", sm: "body1" } }}>
          {material.quantity.toLocaleString()}
        </Typography>
      </Grid>
    </Grid>
  );
}
