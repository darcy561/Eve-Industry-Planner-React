import { useState } from "react";
import {
  Grid,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import useUsersStore from "../../../Zustand/usersStore";
import ContentPanel from "../../../Styled Components/Paper/ContentPanel";
import { flushPendingGroupSave } from "../../../Functions/Debounce/jobGroupsPersistSchedule.js";
import { useActiveGroupCanEdit } from "../../../Hooks/DocumentLock/useDocumentLockState";
import { useHasChanged } from "../../../Hooks/useHasChanged";

function GroupNameFrame() {
  const canEdit = useActiveGroupCanEdit();
  const { updateModifiedGroups, getActiveGroupObject } =
    useUsersStore.getState().jobData.actions;
  const [allowEditGroupName, updateAllowEditGroupName] = useState(false);
  const [editGroupNameText, updateEditGroupNameText] = useState("");

  /* Losing the lock shuts the editor for good rather than hiding it, so the
   * lock returning cannot reopen it on text seeded before whatever took it. */
  if (useHasChanged(canEdit) && !canEdit) {
    updateAllowEditGroupName(false);
  }

  const selectedGroup = getActiveGroupObject();
  const editing = allowEditGroupName && canEdit;

  if (!selectedGroup) return null;

  function handleOpen() {
    updateEditGroupNameText(selectedGroup.groupName);
    updateAllowEditGroupName(true);
  }

  async function handleSave() {
    selectedGroup.setGroupName(editGroupNameText);
    updateModifiedGroups(selectedGroup);
    updateAllowEditGroupName(false);
    /* Same as new group flow: PUT must reach Mongo promptly or changestream/WS never
     * notifies other tabs — `updateModifiedGroups` alone only schedules a 2s debounced save. */
    await flushPendingGroupSave();
  }

  function handleClose() {
    updateAllowEditGroupName(false);
  }

  return (
    <ContentPanel componentName="Group Name Frame">
      {!editing ? (
        <Grid container sx={{ width: "100%" }}>
          <Grid size={11}>
            <Typography variant="h5" align="left" color="primary">
              {selectedGroup.groupName}
            </Typography>
          </Grid>
          <Grid align="center" size={1}>
            <Tooltip title="Edit Group Name" arrow placement="bottom">
              <span>
                <IconButton
                  size="small"
                  disabled={!canEdit}
                  onClick={handleOpen}
                >
                  <EditIcon color="primary" />
                </IconButton>
              </span>
            </Tooltip>
          </Grid>
        </Grid>
      ) : (
        <Grid container sx={{ width: "100%" }}>
          <Grid size={10}>
            <TextField
              variant="standard"
              value={editGroupNameText}
              sx={{ width: "100%" }}
              onChange={(e) => updateEditGroupNameText(e.target.value)}
            />
          </Grid>
          <Grid align="right" size={2}>
            <Tooltip title="Save Changes" arrow placement="bottom">
              <IconButton
                size="small"
                sx={{
                  "&:hover": {
                    "& .MuiSvgIcon-root": {
                      color: "success.main",
                    },
                  },
                }}
                onClick={handleSave}
              >
                <SaveIcon color="primary" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Revert Changes" arrow placement="bottom">
              <IconButton
                size="small"
                sx={{
                  "&:hover": {
                    "& .MuiSvgIcon-root": {
                      color: "error.main",
                    },
                  },
                }}
                onClick={handleClose}
              >
                <CloseIcon color="primary" />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      )}
    </ContentPanel>
  );
}

export default GroupNameFrame;
