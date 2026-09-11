import { Button, TextField } from "@mui/material";
import { useState } from "react";
import ContentDialogue from "../../../../Styled Components/Dialogue/ContentDialogue";
import useUsersStore from "../../../../Zustand/usersStore";
import { putWatchlistDeprecatedToApi } from "../../../../Functions/Endpoints/Private/watchlistDeprecated.js";
import DOMPurify from "dompurify";

/**
 * Renames or deletes a watchlist group. Mounted only while it is open, so the
 * name it starts on is the group's own.
 *
 * @param {Object} props
 * @param {Object} props.groupSettingsContent - The group being settings-edited
 * @param {Function} props.onClose
 */
export function GroupSettingsDialogue({ groupSettingsContent, onClose }) {
  const { userWatchlist } = useUsersStore((state) => state.jobData);
  const { setUserWatchlist, setUserWatchlistGroups } =
    useUsersStore.getState().jobData.actions;
  const [setName, updateSetName] = useState(groupSettingsContent.name);

  return (
    <ContentDialogue
      open
      onClose={onClose}
      title="Group Settings"
      componentName="GroupSettingsDialogue"
      useAppShellDesign
      actions={
        <>
          <Button
            color="error"
            variant="outlined"
            size="small"
            sx={{ marginRight: "20px" }}
            onClick={async () => {
              let newUserWatchlistGroups = [...userWatchlist.groups];
              let newUserWatchlistItems = [...userWatchlist.items];
              let index = newUserWatchlistGroups.findIndex(
                (i) => i.id === groupSettingsContent.id,
              );
              newUserWatchlistGroups.splice(index, 1);

              newUserWatchlistItems.forEach((entry) => {
                if (entry.group === groupSettingsContent.id) {
                  entry.group = 0;
                }
              });
              setUserWatchlist(newUserWatchlistItems, newUserWatchlistGroups);
              await putWatchlistDeprecatedToApi(
                newUserWatchlistGroups,
                newUserWatchlistItems,
              );
              onClose();
            }}
          >
            Delete
          </Button>
          <Button size="small" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={async () => {
              let newUserWatchlistGroups = [...userWatchlist.groups];
              let index = newUserWatchlistGroups.findIndex(
                (i) => i.id === groupSettingsContent.id,
              );
              newUserWatchlistGroups[index].name = DOMPurify.sanitize(setName, {
                ALLOWED_TAGS: [],
                ALLOWED_ATTR: [],
              });
              setUserWatchlistGroups(newUserWatchlistGroups);
              await putWatchlistDeprecatedToApi(
                newUserWatchlistGroups,
                userWatchlist.items,
              );
              onClose();
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <TextField
        defaultValue={setName}
        size="small"
        vairant="standard"
        helperText="Group Name"
        type="text"
        sx={{
          "& .MuiFormHelperText-root": {
            color: (theme) => theme.palette.secondary.main,
          },
          "& input::-webkit-clear-button, & input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
            {
              display: "none",
            },
        }}
        onChange={(e) => {
          updateSetName(e.target.value);
        }}
      />
    </ContentDialogue>
  );
}
