import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  TextField,
} from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { UserWatchlistContext } from "../../../../Context/AuthContext";
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
  const { userWatchlist, updateUserWatchlist } =
    useContext(UserWatchlistContext);
  const { uploadUserWatchlist } = useFirebase();
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
          onClick={async () => {
            let newUserWatchlistGroups = [...userWatchlist.groups];
            let newUserWatchlistItems = [...userWatchlist.items];
            let index = newUserWatchlistGroups.findIndex(
              (i) => i.id === groupSettingsContent.id
            );
            newUserWatchlistGroups.splice(index, 1);

            newUserWatchlistItems.forEach((entry) => {
              if (entry.group === groupSettingsContent.id) {
                entry.group = 0;
              }

            });
            updateUserWatchlist({
              groups: newUserWatchlistGroups,
              items: newUserWatchlistItems,
            });
            await uploadUserWatchlist(newUserWatchlistGroups, newUserWatchlistItems);
            handleClose();
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
          onClick={async () => {
            let newUserWatchlistGroups = [...userWatchlist.groups];
            let index = newUserWatchlistGroups.findIndex(
              (i) => i.id === groupSettingsContent.id
            );
            newUserWatchlistGroups[index].name = setName;
            updateUserWatchlist((prev) => ({
              ...prev,
              groups: newUserWatchlistGroups,
            }));
            await uploadUserWatchlist(newUserWatchlistGroups, userWatchlist.items);
            handleClose();
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
