import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Grid,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SettingsIcon from "@mui/icons-material/Settings";
import { WatchListRow } from "./ItemRow";
import { useContext, useState } from "react";
import { UserWatchlistContext } from "../../../../Context/AuthContext";
import { useFirebase } from "../../../../Hooks/useFirebase";

export function WatchlistGroup({
  group,
  parentUser,
  index,
  updateGroupSettingsTrigger,
  updateGroupSettingsContent,
}) {
  const { userWatchlist, updateUserWatchlist } =
    useContext(UserWatchlistContext);
  const { uploadUserWatchlist } = useFirebase();
  const [expandGroup, updateExpandGroup] = useState(group.expanded);

  return (
    <Grid item xs={12}>
      <Accordion
        expanded={expandGroup}
        square
        spacing={1}
        id={group.id}
        disableGutters
        sx={{
          "& .MuiAccordionSummary-root:hover": {
            cursor: "default",
          },
        }}
      >
        <AccordionSummary
          expandIcon={
            <Tooltip title="Expand/Collapse Group" arrow placement="bottom">
              <IconButton
                color="secondary"
                onClick={() => {
                  let newUserWatchlistGroups = [...userWatchlist.groups];
                  newUserWatchlistGroups[index].expanded =
                    !newUserWatchlistGroups[index].expanded;
                  updateExpandGroup((prev) => !prev);
                  updateUserWatchlist((prev) => ({
                    ...prev,
                    groups: newUserWatchlistGroups,
                  }));
                }}
              >
                <ExpandMoreIcon />
              </IconButton>
            </Tooltip>
          }
        >
          <Box sx={{ width: "100%", display: "flex", flexDirection: "row" }}>
            <Box
              sx={{ display: "flex", flex: "1 1 95%", flexDirection: "row" }}
            >
              <Typography
                variant="h6"
                sx={{
                  color: (theme) =>
                    theme.palette.mode === "dark"
                      ? "secondary"
                      : theme.palette.primary.main,
                }}
              >
                {group.name}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "row" }}>
              <Tooltip title="Group Settings" arrow placement="bottom">
                <IconButton
                  color="secondary"
                  onClick={() => {
                    updateGroupSettingsContent(userWatchlist.groups[index]);
                    updateGroupSettingsTrigger((prev) => !prev);
                  }}
                >
                  <SettingsIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {userWatchlist.items.map((item, index) => {
            if (item.group === group.id) {
              return (
                <WatchListRow
                  key={item.id}
                  item={item}
                  parentUser={parentUser}
                  index={index}
                />
              );
            } else return null;
          })}
        </AccordionDetails>
      </Accordion>
    </Grid>
  );
}
