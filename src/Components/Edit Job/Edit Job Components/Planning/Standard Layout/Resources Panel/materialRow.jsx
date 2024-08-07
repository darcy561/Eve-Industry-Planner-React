import { useState } from "react";
import {
  CircularProgress,
  Grid,
  Icon,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { jobTypes } from "../../../../../../Context/defaultValues";
import DoneIcon from "@mui/icons-material/Done";
import LensIcon from "@mui/icons-material/Lens";

export function MaterialRow({
  activeJob,
  material,
  displayType,
  temporaryChildJobs,
  parentChildToEdit,
}) {
  const theme = useTheme();

  const quantityToUse =
    displayType === "active"
      ? activeJob.build.setup[activeJob.layout.setupToEdit].materialCount[
          material.typeID
        ].quantity
      : material.quantity;

  const jobTypeTextMap = {
    [jobTypes.baseMaterial]: "Base Material",
    [jobTypes.manufacturing]: "Manufacturing Job",
    [jobTypes.reaction]: "Reaction Job",
    [jobTypes.pi]: "Planetary Interaction",
  };

  function colorSelector() {
    const { jobType, typeID } = material;
    const { childJobs } = activeJob.build;

    switch (jobType) {
      case jobTypes.manufacturing:
      case jobTypes.reaction:
        if (childJobs[typeID].length > 0) {
          return jobType === jobTypes.manufacturing
            ? theme.palette.manufacturing.main
            : theme.palette.reaction.main;
        } else if (
          temporaryChildJobs[typeID] ||
          parentChildToEdit.childJobs[typeID]?.add.length > 0
        ) {
          return theme.palette.warning.main;
        } else {
          return jobType === jobTypes.manufacturing
            ? theme.palette.manufacturing.main
            : theme.palette.reaction.main;
        }

      case jobTypes.pi:
        return theme.palette.pi.main;

      default:
        return theme.palette.baseMat.main;
    }
  }

  return (
    <Grid item container>
      <Grid item xs={2} sm={1} align="center">
        {activeJob.build.childJobs[material.typeID].length === 0 &&
        !temporaryChildJobs[material.typeID] &&
        (!parentChildToEdit.childJobs[material.typeID]?.add ||
          parentChildToEdit.childJobs[material.typeID].add.length === 0) ? (
          <Tooltip
            title={jobTypeTextMap[material.jobType]}
            placement="left-start"
            arrow
          >
            <Icon
              sx={{
                color: colorSelector(),
              }}
            >
              <LensIcon fontSize="small" />
            </Icon>
          </Tooltip>
        ) : (
          <Tooltip
            title={
              temporaryChildJobs[material.typeID] ||
              parentChildToEdit.childJobs[material.typeID]?.add.length > 0
                ? `${jobTypeTextMap[material.jobType]} Pending`
                : `${jobTypeTextMap[material.jobType]} Linked`
            }
            placement="left-start"
            arrow
          >
            <Icon
              size="small"
              sx={{
                color: colorSelector(),
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
          {quantityToUse.toLocaleString()}
        </Typography>
      </Grid>
    </Grid>
  );
}
