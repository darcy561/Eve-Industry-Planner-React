import {
  Avatar,
  CircularProgress,
  Grid,
  Grow,
  Paper,
  Typography,
  Zoom,
} from "@mui/material";
import { useContext, useEffect } from "react";
import {
  UserJobSnapshotContext,
  UsersContext,
  UserWatchlistContext,
} from "../../../Context/AuthContext";
import { UserLoginUIContext } from "../../../Context/LayoutContext";

export function UserLogInUI() {
  const {
    userUIData,
    updateUserUIData,
    loginInProgressComplete,
    updateLoginInProgressComplete,
  } = useContext(UserLoginUIContext);
  const { userWatchlistDataFetch } = useContext(UserWatchlistContext);
  const { userJobSnapshotDataFetch } = useContext(UserJobSnapshotContext);
  const { userDataFetch } = useContext(UsersContext);

  // useEffect(() => {
  //   if (userWatchlistDataFetch && userJobSnapshotDataFetch && userDataFetch) {
  //     console.log("true")
  //     updateLoginInProgressComplete(true);
  //   }
  // }, [userWatchlistDataFetch, userJobSnapshotDataFetch, userDataFetch]);

  return (
    <Paper
      elevation={3}
      sx={{
        minHeight: "80vh",
        marginRight: { md: "10px" },
        marginLeft: { md: "10px" },
        marginTop: { md: "10px" },
        padding: "20px",
      }}
      square
    >
      <Grid container>
        <Grid item xs={12} align="center" sx={{ padding: "20px" }}>
          <CircularProgress color="primary" />
        </Grid>
        <Grid container item xs={12}>
          {userUIData.map((user, index) => {
            if (index > 5) return null;

            return (
              <Zoom key={user.CharacterID} in={true}>
                <Grid container item xs={12} sm={4} md={2} xl={1}>
                  <Grid item xs={12} align="center">
                    <Avatar
                      src={`https://images.evetech.net/characters/${user.CharacterID}/portrait`}
                      variant="circular"
                      sx={{
                        height: { xs: "48px", sm: "64px", lg: "128px" },
                        width: { xs: "48px", sm: "64px", lg: "128px" },
                      }}
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
        {userDataFetch && (
          <Grid container item xs={4}>
            ff
          </Grid>
        )}
        {userJobSnapshotDataFetch && (
          <Grid container item xs={4}>
            ff
          </Grid>
        )}
        {userWatchlistDataFetch && (
          <Grid container item xs={4}>
            ff
          </Grid>
        )}
      </Grid>
    </Paper>
  );
}
