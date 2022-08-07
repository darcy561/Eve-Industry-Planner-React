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
import { UsersContext } from "../../../../Context/AuthContext";

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
  const { users, updateUsers } = useContext(UsersContext);
  const [setName, updateSetName] = useState("");
  const { updateMainUserDoc } = useFirebase();
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
            let newUsers = [...users];
            let pIndex = newUsers.findIndex((i) => i.ParentUser);
            newUsers[pIndex].watchlist.groups.push({
              id: Date.now(),
              name: setName,
              expanded: true,
            });
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
