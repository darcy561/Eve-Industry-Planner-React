import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  TextField,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import { useContext, useState } from "react";
import { useFirebase } from "../../../../Hooks/useFirebase";
import { UserWatchlistContext } from "../../../../Context/AuthContext";

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

export function AddGroupDialog({
  addNewGroupTrigger,
  updateAddNewGroupTrigger,
}) {
  const { userWatchlist, updateUserWatchlist } = useContext(UserWatchlistContext);
  const [setName, updateSetName] = useState("");
  const { uploadUserWatchlist } = useFirebase();
  const classes = useStyles();
  const handleClose = () => {
    updateSetName("");
    updateAddNewGroupTrigger((prev) => !prev);
  };
  return (
    <Dialog open={addNewGroupTrigger} onClose={handleClose}>
      <DialogContent>
        <TextField
          defaultValue={setName}
          size="small"
          variant="standard"
          className={classes.TextField}
          helperText="Group Name"
          type="text"
          onChange={(e) => {
            updateSetName(e.target.value);
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button size="small" onClick={handleClose}>
          Close
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={() => {
            let newUserWatchlistGroups = [...userWatchlist.groups]
            newUserWatchlistGroups.push({
              id: Date.now(),
              name: setName,
              expanded: true,
            });
            updateUserWatchlist((prev)=>({...prev, groups: newUserWatchlistGroups}));
            uploadUserWatchlist(newUserWatchlistGroups, userWatchlist.items);
            handleClose();
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
