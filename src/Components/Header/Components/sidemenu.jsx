import {
  Box,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  SwipeableDrawer,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { IsLoggedInContext } from "../../../Context/AuthContext";
import { EveESIStatusContext } from "../../../Context/EveDataContext";


export function SideMenu(props) {
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { eveESIStatus } = useContext(EveESIStatusContext);
  const open = props.open;
  const setOpen = props.setOpen;
  const navigate = useNavigate();

  return (
    <SwipeableDrawer
      anchor="left"
      open={open}
      onClick={() => {}}
      onClose={() => {
        setOpen(false);
      }}
      onOpen={() => {
        setOpen(true);
      }}
    >
      <Box sx={{minHeight:"4rem"}}>
        {isLoggedIn && (
          <>
            <Grid container sx={{padding:{xs:"8px 0px", sm: "10px 0px"}}} >
              <Grid item xs={12} align="center" >
                <Typography variant="body1">
                  Tranquility:{" "}
                  {eveESIStatus.serverStatus.online ? "Online" : "Offline"}
                </Typography>
                <Typography variant="body1">
                  Player Count: {eveESIStatus.serverStatus.playerCount.toLocaleString()}
                </Typography>
              </Grid>
            </Grid>
          </>
        )}
      </Box>

      <Box sx={{width:"250px"}}>
        <Divider />
        <List>
          <ListItem
            button
            onClick={() => {
              navigate("/");
              setOpen(false);
            }}
          >
            {isLoggedIn ? (
              <ListItemText primary={"Dashboard"} />
            ) : (
              <ListItemText primary={"Home"} />
            )}
          </ListItem>
          <Divider />
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
        </List>
      </Box>
    </SwipeableDrawer>
  );
}
