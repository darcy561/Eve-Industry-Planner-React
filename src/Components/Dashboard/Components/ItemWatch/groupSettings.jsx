import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  TextField,
} from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { UsersContext } from "../../../../Context/AuthContext";
import { makeStyles } from "@mui/styles";
import { useFirebase } from "../../../../Hooks/useFirebase";

const useStyles = makeStyles((theme) => ({
  TextField: {
    "& .MuiFormHelperText-root": {
      color: theme.palette.secondary.main,
    },
    "& input::-webkit-clear-button, & input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
      {
        display: "none",
      },
  },
}));
export function GroupSettingsDialog({
  groupSettingsTrigger,
  updateGroupSettingsTrigger,
  groupSettingsContent,
}) {
  const { users, updateUsers } = useContext(UsersContext);
  const { updateMainUserDoc } = useFirebase();
  const [setName, updateSetName] = useState(groupSettingsContent.name);

  useEffect(() => {
    function updateSettingsState() {
      updateSetName(groupSettingsContent.name);
    }
    updateSettingsState();
  }, [groupSettingsContent]);

  const classes = useStyles();

  const handleClose = () => {
    updateGroupSettingsTrigger((prev) => !prev);
  };

  return (
    <Dialog open={groupSettingsTrigger} onClose={handleClose}>
      <DialogContent>
        <TextField
          defaultValue={setName}
          size="small"
          vairant="standard"
          helperText="Group Name"
          type="text"
          className={classes.TextField}
          onChange={(e) => {
            updateSetName(e.target.value);
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button
          color="error"
          variant="outlined"
          size="small"
          sx={{ marginRight: "20px" }}
          onClick={() => {
            let newUsers = [...users];
            let pIndex = newUsers.findIndex((o) => o.ParentUser);
            let index = newUsers[pIndex].watchlist.groups.findIndex(
              (i) => i.id === groupSettingsContent.id
            );
            newUsers[pIndex].watchlist.groups.splice(index, 1);

            newUsers[pIndex].watchlist.items.forEach((entry) => {
              if (entry.group === groupSettingsContent.id) {
                entry.group = null;
              }
              updateUsers(newUsers);
              updateMainUserDoc();
              handleClose();
            });
          }}
        >
          Delete
        </Button>
        <Button size="small" onClick={handleClose}>
          Close
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={() => {
            let newUsers = [...users];
            let pIndex = newUsers.findIndex((o) => o.ParentUser);
            let index = newUsers[pIndex].watchlist.groups.findIndex(
              (i) => i.id === groupSettingsContent.id
            );
            newUsers[pIndex].watchlist.groups[index].name = setName;
            updateUsers(newUsers);
            updateMainUserDoc();
            handleClose();
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
