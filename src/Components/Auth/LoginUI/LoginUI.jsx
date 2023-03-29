import {
  Avatar,
  CircularProgress,
  Grid,
  Grow,
  Paper,
  Typography,
  Zoom
} from "@mui/material";
import { useContext } from "react";
import { UserLoginUIContext } from "../../../Context/LayoutContext";

export function UserLogInUI() {
  const {
    userUIData,
    updateUserUIData,
    loginInProgressComplete,
    updateLoginInProgressComplete,
  } = useContext(UserLoginUIContext);
  return (
    <Paper
      elevation={3}
      sx={{
        height: "100%",
        marginRight: { md: "10px" },
        marginLeft: { md: "10px" },
        marginTop: { md: "10px" },
        padding: "20px",
      }}
      square
    >
      <Grid container>
        {userUIData.map((user) => {
          return (
            <Zoom key={user.CharacterID} in={true}>
              <Grid container item xs={12} sm={4} md={2} xl={1}>
                <Grid item xs={12} align="center">
                  <Avatar
                    src={`https://images.evetech.net/characters/${user.CharacterID}/portrait`}
                    variant="circular"
                    sx={{ height: "128px", width: "128px" }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography align="center">{user.CharacterName}</Typography>
                </Grid>
              </Grid>
            </Zoom>
          );
        })}
      </Grid>
    </Paper>
  );
}
