import {
  Box,
  Container,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import { useContext, useState } from "react";
import { ActiveJobContext } from "../../../../../Context/JobContext";
import { useJobManagement } from "../../../../../Hooks/useJobManagement";
import { MdOutlineAddCircle, MdRemoveCircle } from "react-icons/md";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { jobTypes } from "../../..";
import CopyToClipboard from "react-copy-to-clipboard";
import { SnackBarDataContext } from "../../../../../Context/LayoutContext";

export function RawResourceList() {
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const [anchorEl, setAnchorEl] = useState(null);
  const { newJobProcess } = useJobManagement();
  const { setSnackbarData } = useContext(SnackBarDataContext);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  let copyText = "";
  let volumeTotal = 0;

  activeJob.build.materials.forEach((i) => {
    copyText = copyText.concat(`${i.name} ${i.quantity}\n`);
    volumeTotal += i.volume * i.quantity;
  });

  function AddBuildIcon({ material }) {
    if (material.jobType === jobTypes.manufacturing) {
      return (
        <Tooltip
          title="Manufacturing Job, click to create a new child job."
          placement="left-start"
          arrow
        >
          <IconButton
            sx={{ color: "manufacturing.main" }}
            size="small"
            onClick={async () => {
              let newJob = await newJobProcess(
                material.typeID,
                material.quantity,
                [activeJob]
              );
              let newMaterials = [...activeJob.build.materials];
              let index = newMaterials.find((i) => i.typeID === newJob.itemID);
              index.childJob.push(newJob.jobID);
              updateActiveJob((prev) => ({
                ...prev,
                build: {
                  ...prev.build,
                  materials: newMaterials,
                },
              }));
            }}
          >
            <MdOutlineAddCircle />
          </IconButton>
        </Tooltip>
      );
    } else if (material.jobType === jobTypes.reaction) {
      return (
        <Tooltip
          title="Reaction Job, click to create a new child job"
          placement="left-start"
          arrow
        >
          <IconButton
            sx={{ color: "reaction.main" }}
            size="small"
            onClick={async () => {
              let newJob = await newJobProcess(
                material.typeID,
                material.quantity,
                [activeJob]
              );
              let newMaterials = [...activeJob.build.materials];
              let index = newMaterials.find((i) => i.typeID === newJob.itemID);
              index.childJob.push(newJob.jobID);
              updateActiveJob((prev) => ({
                ...prev,
                build: {
                  ...prev.build,
                  materials: newMaterials,
                },
              }));
            }}
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
        minWidth: "100%",
        paddingBottom: "20px",
        paddingTop: "20px",
        position: "relative",
      }}
      elevation={3}
      square={true}
    >
      <Container disableGutters={true}>
        <Box sx={{ marginBottom: "20px" }}>
          <Grid container direction="row">
            <Grid item xs={12}>
              <Typography variant="h6" color="primary" align="center">
                Raw Resources
              </Typography>
            </Grid>
            <IconButton
              id="rawResources_menu_button"
              onClick={handleMenuClick}
              aria-controls={
                Boolean(anchorEl) ? "rawResources_menu" : undefined
              }
              aria-haspopup="true"
              aria-expanded={Boolean(anchorEl) ? "true" : undefined}
              sx={{ position: "absolute", top: "10px", right: "10px" }}
            >
              <MoreVertIcon size="small" color="Secondary" />
            </IconButton>
            <Menu
              id="rawResources_menu"
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              MenuListProps={{
                "aria-labelledby": "rawResources_menu_button",
              }}
            >
              <CopyToClipboard
                text={copyText}
                onCopy={() => {
                  setSnackbarData((prev) => ({
                    ...prev,
                    open: true,
                    message: `Resource List Copied`,
                    severity: "success",
                    autoHideDuration: 1000,
                  }));
                }}
              >
                <MenuItem>Copy Resources List</MenuItem>
              </CopyToClipboard>
            </Menu>
          </Grid>
        </Box>
        <Box
          sx={{
            marginLeft: { xs: "5px", md: "15px" },
            marginRight: { xs: "10px", md: "20px" },
          }}
        >
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
        <Grid container sx={{ marginTop: "20px" }}>
          <Grid item xs={6} sm={8} md={9}>
            <Typography varinat="body2" align="right">
              Total Volume
            </Typography>
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <Typography variant="body2" align="center">
              {volumeTotal.toLocaleString()} m3
            </Typography>
          </Grid>
        </Grid>
      </Container>
    </Paper>
  );
}
