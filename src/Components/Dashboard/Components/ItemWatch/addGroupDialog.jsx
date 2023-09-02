import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  TextField,
} from "@mui/material";
import { useContext, useState } from "react";
import { useFirebase } from "../../../../Hooks/useFirebase";
import { UserWatchlistContext } from "../../../../Context/AuthContext";
import { getAnalytics, logEvent } from "firebase/analytics";

export function AddGroupDialog({
  addNewGroupTrigger,
  updateAddNewGroupTrigger,
  parentUser,
}) {
  const { userWatchlist, updateUserWatchlist } =
    useContext(UserWatchlistContext);
  const [setName, updateSetName] = useState("");
  const { uploadUserWatchlist } = useFirebase();
  const analytics = getAnalytics();
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
          sx={{
            "& .MuiFormHelperText-root": {
              color: (theme) => theme.palette.secondary.main,
            },
            "& input::-webkit-clear-button, & input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
              {
                display: "none",
              },
          }}
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
            let newUserWatchlistGroups = [...userWatchlist.groups];
            newUserWatchlistGroups.push({
              id: Date.now(),
              name: setName,
              expanded: true,
            });
            newUserWatchlistGroups.sort((a, b) => {
              if (a.name < b.name) {
                return -1;
              }
              if (a.name > b.name) {
                return 1;
              }
              return 0;
            });
            updateUserWatchlist((prev) => ({
              ...prev,
              groups: newUserWatchlistGroups,
            }));
            uploadUserWatchlist(newUserWatchlistGroups, userWatchlist.items);
            logEvent(analytics, "New Watchlist Group", {
              UID: parentUser.accountID,
            });
            handleClose();
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
