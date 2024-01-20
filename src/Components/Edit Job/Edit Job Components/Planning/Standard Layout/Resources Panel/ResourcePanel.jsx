import {
  Box,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Select,
  Typography,
} from "@mui/material";
import { useContext, useMemo, useState } from "react";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CopyToClipboard from "react-copy-to-clipboard";
import { SnackBarDataContext } from "../../../../../../Context/LayoutContext";
import { MaterialRow } from "./materialRow";
import { useJobManagement } from "../../../../../../Hooks/useJobManagement";
import { jobTypes } from "../../../../../../Context/defaultValues";
import { useManageGroupJobs } from "../../../../../../Hooks/GroupHooks/useManageGroupJobs";
import { useJobBuild } from "../../../../../../Hooks/useJobBuild";
import { UsersContext } from "../../../../../../Context/AuthContext";
import { useFirebase } from "../../../../../../Hooks/useFirebase";
import { EvePricesContext } from "../../../../../../Context/EveDataContext";

export function RawResourceList({
  activeJob,
  updateActiveJob,
  setupToEdit,
  setJobModified,
  temporaryChildJobs,
  updateTemporaryChildJobs,
  parentChildToEdit,
  updateParentChildToEdit,
}) {
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { users } = useContext(UsersContext);
  const { updateEvePrices } = useContext(EvePricesContext);
  const [anchorEl, setAnchorEl] = useState(null);
  const [displayType, updateDisplyType] = useState(
    activeJob.layout?.resourceDisplayType || "all"
  );
  const { findJobIDOfMaterialFromGroup } = useManageGroupJobs();
  const { buildJob } = useJobBuild();
  const { generatePriceRequestFromJob } = useJobManagement();
  const { getItemPrices } = useFirebase();

  const parentUser = useMemo(() => users.find((i) => i.ParentUser), [users]);

  if (!activeJob.build.setup[setupToEdit]) return null;

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  let copyText = "";
  let volumeTotal = 0;

  activeJob.build.materials.forEach((i) => {
    let quantityToUse =
      displayType === "active"
        ? activeJob.build.setup[setupToEdit].materialCount[i.typeID].quantity
        : i.quantity;
    copyText = copyText.concat(`${i.name} ${quantityToUse}\n`);
    volumeTotal += i.volume * quantityToUse;
  });

  return (
    <Paper
      sx={{
        minWidth: "100%",
        padding: "20px",
        position: "relative",
      }}
      elevation={3}
      square
    >
      <Grid container>
        <Grid
          item
          xs={12}
          align="center"
          sx={{ marginBottom: { xs: "50px", sm: "20px", lg: "40px" } }}
        >
          <Typography variant="h6" color="primary" align="center">
            Raw Resources
          </Typography>
        </Grid>
        <Select
          variant="standard"
          size="small"
          value={displayType}
          sx={{
            position: "absolute",
            top: { xs: "55px", sm: "20px" },
            left: { xs: "10% ", sm: "30px" },
          }}
          onChange={(e) => {
            updateActiveJob((prev) => ({
              ...prev,
              layout: {
                ...prev.layout,
                resourceDisplayType: e.target.value,
              },
            }));
            updateDisplyType(e.target.value);
          }}
        >
          <MenuItem key="all" value="all">
            Display All Setups
          </MenuItem>
          <MenuItem key="active" value="active">
            Display Selected Setup
          </MenuItem>
        </Select>
        <IconButton
          id="rawResources_menu_button"
          onClick={handleMenuClick}
          aria-controls={Boolean(anchorEl) ? "rawResources_menu" : undefined}
          aria-haspopup="true"
          aria-expanded={Boolean(anchorEl) ? "true" : undefined}
          sx={{ position: "absolute", top: "10px", right: "10px" }}
        >
          <MoreVertIcon size="small" color="primary" />
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
              handleMenuClose();
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
          <MenuItem onClick={buildAllChildJobs}>Create All Child Jobs</MenuItem>
        </Menu>
      </Grid>
      <Box
        sx={{
          marginLeft: { xs: "5px", md: "15px" },
          marginRight: { xs: "10px", md: "20px" },
        }}
      >
        <Grid container item direction="column">
          {activeJob.build.materials.map((material) => {
            return (
              <MaterialRow
                key={material.typeID}
                material={material}
                setupToEdit={setupToEdit}
                displayType={displayType}
                activeJob={activeJob}
                updateActiveJob={updateActiveJob}
                temporaryChildJobs={temporaryChildJobs}
                parentChildToEdit={parentChildToEdit}
                updateParentChildToEdit={updateParentChildToEdit}
              />
            );
          })}
        </Grid>
      </Box>
      <Grid container sx={{ marginTop: "20px" }}>
        <Grid item xs={6} sm={8} md={9}>
          <Typography
            sx={{ typography: { xs: "caption", sm: "body2" } }}
            align="right"
          >
            Total Volume
          </Typography>
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <Typography
            sx={{ typography: { xs: "caption", sm: "body2" } }}
            align="center"
          >
            {volumeTotal.toLocaleString()} m3
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  );
  async function buildAllChildJobs() {
    let buildRequestArray = [];
    const groupJobsToLink = new Map();
    const newParentJobsToEdit_ChildJobs = {
      ...parentChildToEdit.childJobs,
    };
    const newTempChildJobs = { ...temporaryChildJobs };

    activeJob.build.materials.forEach(({ jobType, typeID, quantity }) => {
      if (jobType !== jobTypes.manufacturing && jobTypes !== jobTypes.reaction)
        return;
      const childJobLocation = activeJob.build.childJobs[typeID];
      const tempChildJob = temporaryChildJobs[typeID];
      if (groupJobCheck(typeID, activeJob.groupID, groupJobsToLink)) return;

      if (childJobLocation.length > 0 || tempChildJob) return;

      buildRequestArray.push({
        itemID: typeID,
        itemQty: quantity,
        groupID: activeJob.groupID,
        parentJobs: [activeJob.jobID],
      });

      function groupJobCheck(requestedTypeID, requestedGroupID, outputMap) {
        if (!activeJob.groupID) return false;
        const matchedGroupJobID = findJobIDOfMaterialFromGroup(
          requestedTypeID,
          requestedGroupID
        );
        if (!matchedGroupJobID || childJobLocation.length > 0 || tempChildJob)
          return false;

        outputMap.set(requestedTypeID, matchedGroupJobID);
        return true;
      }
    });
    if (buildRequestArray.length === 0) return;
    const newJobs = await buildJob(buildRequestArray);

    const requiredItemPricesSet = newJobs.reduce((prev, job) => {
      return new Set([...prev, ...generatePriceRequestFromJob(job)]);
    }, new Set());

    const pricePromise = [
      getItemPrices([...requiredItemPricesSet], parentUser),
    ];

    activeJob.build.materials.forEach(({ jobType, typeID }) => {
      if (jobType !== jobTypes.manufacturing && jobTypes !== jobTypes.reaction)
        return;

      if (groupJobsToLink.get(typeID)) {
        if (newParentJobsToEdit_ChildJobs[typeID]) {
          newParentJobsToEdit_ChildJobs[typeID].add.push(
            groupJobsToLink.get(typeID)
          );
        } else {
          newParentJobsToEdit_ChildJobs[typeID] = {
            add: [groupJobsToLink.get(typeID)],
            remove: [],
          };
        }
        return;
      }

      const matchedJob = newJobs.find((i) => i.itemID === typeID);

      if (!matchedJob) return;

      newTempChildJobs[typeID] = matchedJob;
    });

    const priceData = (await Promise.all(pricePromise)).flat();

    updateTemporaryChildJobs(newTempChildJobs);
    updateParentChildToEdit((prev) => ({
      ...prev,
      childJobs: newParentJobsToEdit_ChildJobs,
    }));
    updateEvePrices((prev) => {
      const prevIds = new Set(prev.map((item) => item.typeID));
      const uniqueNewEvePrices = priceData.filter(
        (item) => !prevIds.has(item.typeID)
      );
      return [...prev, ...uniqueNewEvePrices];
    });
    setJobModified(true);
  }
}
