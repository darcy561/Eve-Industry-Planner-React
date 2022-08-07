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
import { UsersContext } from "../../../../Context/AuthContext";
import { makeStyles } from "@mui/styles";
import { useFirebase } from "../../../../Hooks/useFirebase";

const useStyles = makeStyles((theme) => ({
  Accordion: {
    "& .MuiAccordionSummary-root:hover": {
      cursor: "default",
    },
  },
  Header: {
    color:
      theme.palette.type === "dark" ? "secondary" : theme.palette.primary.main,
  },
}));

export function WatchlistGroup({
  group,
  parentUser,
  index,
  updateGroupSettingsTrigger,
  updateGroupSettingsContent,
}) {
  const { users, updateUsers } = useContext(UsersContext);
  const { updateMainUserDoc } = useFirebase();
  const [expandGroup, updateExpandGroup] = useState(group.expanded);
  const classes = useStyles();

  return (
    <Grid item xs={12}>
      <Accordion
        className={classes.Accordion}
        expanded={expandGroup}
        square={true}
        spacing={1}
        id={group.id}
        disableGutters={true}
      >
        <AccordionSummary
          expandIcon={
            <Tooltip title="Expand/Collapse Group" arrow placement="bottom">
              <IconButton
                color="secondary"
                onClick={() => {
                  let newUsers = [...users];
                  let pIndex = newUsers.findIndex((o) => o.ParentUser);

                  newUsers[pIndex].watchlist.groups[index].expanded =
                    !newUsers[pIndex].watchlist.groups[index].expanded;
                  updateExpandGroup((prev) => !prev);
                  updateUsers(newUsers);
                  updateMainUserDoc()
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
              <Typography variant="h6" className={classes.Header}>{group.name}</Typography>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "row" }}>
              <Tooltip title="Group Settings" arrow placement="bottom">
                <IconButton
                  color="secondary"
                  onClick={() => {
                    updateGroupSettingsContent(
                      parentUser.watchlist.groups[index]
                    );
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
          {parentUser.watchlist.items.map((item, index) => {
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
