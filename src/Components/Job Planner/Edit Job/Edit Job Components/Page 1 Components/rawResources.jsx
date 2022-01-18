import {
  Box,
  Container,
  Grid,
  IconButton,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useContext } from "react";
import { ActiveJobContext } from "../../../../../Context/JobContext";
import { useJobManagement } from "../../../../../Hooks/useJobManagement";
import { MdOutlineAddCircle, MdRemoveCircle } from "react-icons/md";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { jobTypes } from "../../..";

export function RawResourceList() {
  const { activeJob } = useContext(ActiveJobContext);
  const { newJobProcess } = useJobManagement();

  function AddBuildIcon({ material }) {
    if (material.jobType === jobTypes.manufacturing) {
      return (
        <Tooltip
          title="Manufacturing Job, click to create as a new job."
          placement="left-start"
          arrow
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
    } else if (material.jobType === jobTypes.reaction) {
      return (
        <Tooltip
          title="Reaction Job, click to create as a new job"
          placement="left-start"
          arrow
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
    } else if (material.jobType === jobTypes.pi) {
      return (
        <Tooltip title="Planetary Interaction" placement="left-start" arrow>
          <IconButton sx={{ color: "pi.main" }} size="small" disableRipple>
            <MdRemoveCircle />
          </IconButton>
        </Tooltip>
      );
    } else if (material.jobType === jobTypes.baseMaterial) {
      return (
        <Tooltip title="Base Material" placement="left-start">
          <IconButton size="small" sx={{ color: "baseMat.main" }} disableRipple>
            <MdRemoveCircle />
          </IconButton>
        </Tooltip>
      );
    }
  }

  return (
    <Paper
      sx={{
        paddingBottom: "20px",
        paddingTop: "20px",
      }}
      elevation={3}
      square={true}
    >
      <Container disableGutters={true}>
        <Box sx={{marginBottom:"20px"}}>
          <Grid
            container
            direction="row"
          >
            <Grid item xs={12} md={11}>
              <Typography
                variant="h5"
                color="primary"
                align="center"
              >
                Raw Resources
              </Typography>
            </Grid>
            <Grid
              item
              md={1}
              sx={{ display: { xs: "none", md: "block" } }}
              align="right"
            >
              <IconButton>
                <MoreVertIcon size="small" color="Secondary" />
              </IconButton>
            </Grid>
          </Grid>
        </Box>
        <Box sx={{ marginLeft:{ xs:"5px", md:"15px" }, marginRight:{xs:"10px", md:"20px"}}}>
          <Grid container item direction="column">
            {activeJob.build.materials.map((material) => {
              return (
                <Grid key={material.typeID} item container direction="row">
                  <Grid item xs={2} sm={1}>
                    <AddBuildIcon material={material} />
                  </Grid>
                  <Grid item xs={7} sm={7}>
                    <Typography variant="body1">{material.name}</Typography>
                  </Grid>
                  <Grid item xs={3} sm={4} align="right">
                    <Typography variant="body1">
                      {material.quantity.toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      </Container>
    </Paper>
  );
}
