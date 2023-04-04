import {
  Avatar,
  CircularProgress,
  Grid,
  Icon,
  Paper,
  Typography,
  Zoom,
} from "@mui/material";
import { useContext, useEffect } from "react";
import { UserLoginUIContext } from "../../../Context/LayoutContext";
import { useNavigate } from "react-router-dom";
import CheckIcon from "@mui/icons-material/Check";
import { Box } from "@mui/system";

export function UserLogInUI({ returnState }) {
  const {
    userUIData,
    updateUserUIData,
    loginInProgressComplete,
    updateLoginInProgressComplete,
    userDataFetch,
    userJobSnapshotDataFetch,
    userWatchlistDataFetch,
    userGroupsDataFetch,
  } = useContext(UserLoginUIContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (
      userWatchlistDataFetch &&
      userJobSnapshotDataFetch &&
      userDataFetch &&
      userGroupsDataFetch
    ) {
      updateLoginInProgressComplete(true);
      if (returnState !== undefined) {
        navigate(returnState);
      }
    }
  }, [
    userWatchlistDataFetch,
    userJobSnapshotDataFetch,
    userDataFetch,
    userGroupsDataFetch,
  ]);

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
                <Grid
                  container
                  item
                  xs={6}
                  sm={4}
                  md={2}
                  xl={1}
                  sx={{ marginBottom: "10px" }}
                >
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

                  <Grid item xs={12} sx={{ marginTop: "5px" }}>
                    <Typography
                      align="center"
                      sx={{ typography: { xs: "body2", sm: "body1" } }}
                    >
                      {user.CharacterName}
                    </Typography>
                  </Grid>
                </Grid>
              </Zoom>
            );
          })}
        </Grid>
        <Grid container item xs={12} sx={{ paddingTop: "10vh" }}>
          <Grid container item xs={6} sm={3}>
            <Grid item xs={12}>
              <Typography
                align="center"
                sx={{ typography: { xs: "caption", sm: "body1" } }}
              >
                Loading User Data
              </Typography>
            </Grid>
            <Grid item xs={12} align="center">
              {userDataFetch ? (
                <Zoom in={true}>
                  <Box>
                    <Icon sx={{ color: "success.main" }}>
                      <CheckIcon />
                    </Icon>
                  </Box>
                </Zoom>
              ) : (
                <CircularProgress color="primary" />
              )}
            </Grid>
          </Grid>
          <Grid container item xs={6} sm={3}>
            <Grid item xs={12}>
              <Typography
                align="center"
                sx={{ typography: { xs: "caption", sm: "body1" } }}
              >
                Loading Snapshot Data
              </Typography>
            </Grid>
            <Grid item xs={12} align="center">
              {userJobSnapshotDataFetch ? (
                <Zoom in={true}>
                  <Icon sx={{ color: "success.main" }}>
                    <CheckIcon />
                  </Icon>
                </Zoom>
              ) : (
                <CircularProgress color="primary" />
              )}
            </Grid>
          </Grid>
          <Grid container item xs={6} sm={3}>
            <Grid item xs={12}>
              <Typography
                align="center"
                sx={{ typography: { xs: "caption", sm: "body1" } }}
              >
                Loading User Groups
              </Typography>
            </Grid>
            <Grid item xs={12} align="center">
              {userGroupsDataFetch ? (
                <Zoom in={true}>
                  <Icon sx={{ color: "success.main" }}>
                    <CheckIcon />
                  </Icon>
                </Zoom>
              ) : (
                <CircularProgress color="primary" />
              )}
            </Grid>
          </Grid>
          <Grid container item xs={6} sm={3}>
            <Grid item xs={12}>
              <Typography
                align="center"
                sx={{ typography: { xs: "caption", sm: "body1" } }}
              >
                Loading User Watchlist
              </Typography>
            </Grid>
            <Grid item xs={12} align="center">
              {userWatchlistDataFetch ? (
                <Zoom in={true}>
                  <Icon sx={{ color: "success.main" }}>
                    <CheckIcon />
                  </Icon>
                </Zoom>
              ) : (
                <CircularProgress color="primary" />
              )}
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
}
