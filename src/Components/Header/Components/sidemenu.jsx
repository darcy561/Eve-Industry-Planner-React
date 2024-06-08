import {
  Box,
  Divider,
  Drawer,
  Grid,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { IsLoggedInContext } from "../../../Context/AuthContext";
import { EveESIStatusContext } from "../../../Context/EveDataContext";
import { getBoolean } from "firebase/remote-config";
import { remoteConfig } from "../../../firebase";

export function SideMenu({ open, setOpen }) {
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { eveESIStatus } = useContext(EveESIStatusContext);

  const navigate = useNavigate();

  const enableUpcomingChanges = getBoolean(
    remoteConfig,
    "enable_upcoming_changes_page"
  );

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={() => {
        setOpen(false);
      }}
    >
      <Box sx={{ minHeight: "4rem" }}>
        {isLoggedIn && (
          <>
            <Grid container sx={{ padding: { xs: "8px 0px", sm: "10px 0px" } }}>
              <Grid item xs={12} align="center">
                <Typography variant="body1">
                  Tranquility:{" "}
                  {eveESIStatus.serverStatus.online ? "Online" : "Offline"}
                </Typography>
                <Typography variant="body1">
                  Player Count:{" "}
                  {eveESIStatus.serverStatus.playerCount.toLocaleString()}
                </Typography>
              </Grid>
            </Grid>
          </>
        )}
      </Box>

      <Box sx={{ width: "250px" }}>
        <List>
          <Divider />

          <ListItem
            button
            onClick={() => {
              navigate("/dashboard");
              setOpen(false);
            }}
          >
            {isLoggedIn ? (
              <ListItemText primary={"Dashboard"} />
            ) : (
              <ListItemText primary={"Home"} />
            )}
          </ListItem>

          <Divider sx={{ marginBottom: "20px" }} />
          {isLoggedIn && (
            <>
              <Divider />
              <ListItem
                button
                onClick={() => {
                  navigate("/asset-library");
                  setOpen(false);
                }}
              >
                <ListItemText primary={"Asset Library"} />
              </ListItem>
            </>
          )}
          <Divider />
          {isLoggedIn && (
            <>
              <ListItem
                button
                onClick={() => {
                  navigate("/blueprint-library");
                  setOpen(false);
                }}
              >
                <ListItemText primary={"Blueprint Library"} />
              </ListItem>
              <Divider />
            </>
          )}

          <ListItem
            button
            onClick={() => {
              navigate("/jobplanner");
              setOpen(false);
            }}
          >
            <ListItemText primary={"Job Planner"} />
          </ListItem>
          <Divider />
          {enableUpcomingChanges && (
            <>
              <ListItem
                button
                onClick={() => {
                  navigate("/upcoming-changes");
                  setOpen(false);
                }}
              >
                <ListItemText primary={"Upcoming Changes"} />
              </ListItem>
              <Divider />
            </>
          )}
        </List>
      </Box>
    </Drawer>
  );
}
