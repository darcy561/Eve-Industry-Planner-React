import { useState } from "react";
import {
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useSetupManagement } from "../../../../../../Hooks/GeneralHooks/useSetupManagement";
import { JobSetupCard } from "./jobSetupCard";
import { useHelperFunction } from "../../../../../../Hooks/GeneralHooks/useHelperFunctions";

export function JobSetupPanel({
  activeJob,
  updateActiveJob,
  setJobModified,
  setupToEdit,
  updateSetupToEdit,
}) {
  const [anchorEl, setAnchorEl] = useState(null);

  const {
    sendSnackbarNotificationSuccess,
    sendSnackbarNotificationError,
    sendSnackbarNotificationWarning,
  } = useHelperFunction();
  const { addNewSetup, deleteActiveSetup } = useSetupManagement();

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

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
      <Tooltip title="Add Setup" arrow placement="top">
        <IconButton
          sx={{ position: "absolute", top: "10px", left: "10px" }}
          color="primary"
          onClick={() => {
            const { jobSetups, newMaterialArray, newTotalProduced } =
              addNewSetup(activeJob);
            updateActiveJob((prev) => ({
              ...prev,
              build: {
                ...prev.build,
                setup: jobSetups,
                materials: newMaterialArray,
                products: {
                  ...prev.build.products,
                  totalQuantity: newTotalProduced,
                },
              },
            }));
            sendSnackbarNotificationSuccess("Added");
            setJobModified(true);
          }}
        >
          <AddIcon />
        </IconButton>
      </Tooltip>
      <Grid container>
        <Grid item xs={12}>
          <Typography variant="h6" align="center" color="primary">
            Build Setup
          </Typography>
        </Grid>
        <IconButton
          id="jobSetups_menu_button"
          onClick={handleMenuClick}
          aria-controls={Boolean(anchorEl) ? "jobSetups_menu" : undefined}
          aria-haspopup="true"
          aria-expanded={Boolean(anchorEl) ? "true" : undefined}
          sx={{ position: "absolute", top: "10px", right: "10px" }}
        >
          <MoreVertIcon size="small" color="primary" />
        </IconButton>
        <Menu
          id="jobSetups_menu"
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          MenuListProps={{
            "aria-labelledby": "jobSetups_menu_button",
          }}
        >
          <MenuItem
            onClick={() => {
              handleMenuClose();
              const {
                jobSetups,
                newMaterialArray,
                newTotalProduced,
                replacementSetupID,
                preventUpdate,
              } = deleteActiveSetup(activeJob, setupToEdit);

              if (preventUpdate) {
                sendSnackbarNotificationWarning(
                  "Cannot delete the final setup. Create a replacement setup first.",
                  3
                );
                return;
              }

              updateSetupToEdit(replacementSetupID);
              updateActiveJob((prev) => ({
                ...prev,
                build: {
                  ...prev.build,
                  setup: jobSetups,
                  materials: newMaterialArray,
                  products: {
                    ...prev.build.products,
                    totalQuantity: newTotalProduced,
                  },
                },
                layout: {
                  ...prev.layout,
                  setupToEdit: replacementSetupID,
                },
              }));
              sendSnackbarNotificationError("Deleted");
              setJobModified(true);
            }}
          >
            Delete Active Setup
          </MenuItem>
        </Menu>
        <Grid container item xs={12} spacing={2} sx={{ marginTop: "20px" }}>
          {Object.values(activeJob.build.setup).map((setupEntry) => {
            return (
              <JobSetupCard
                key={setupEntry.id}
                setupEntry={setupEntry}
                activeJob={activeJob}
                updateActiveJob={updateActiveJob}
                setJobModified={setJobModified}
                setupToEdit={setupToEdit}
                updateSetupToEdit={updateSetupToEdit}
              />
            );
          })}
        </Grid>
      </Grid>
    </Paper>
  );
}
