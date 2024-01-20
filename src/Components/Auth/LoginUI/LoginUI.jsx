import {
  Avatar,
  Box,
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
import { IsLoggedInContext } from "../../../Context/AuthContext";

export function UserLogInUI({}) {
  const { isLoggedIn } = useContext(IsLoggedInContext);
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
      setTimeout(() => {
        updateLoginInProgressComplete(true);
        switch (userUIData.returnState) {
          case undefined:
            break;
          case "/":
            switch (isLoggedIn) {
              case true:
                navigate("/dashboard");
                break;
              default:
                navigate("/");
                break;
            }
            break;
          default:
            navigate(userUIData.returnState);
            break;
        }
      }, 2000);
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
          {!userWatchlistDataFetch ||
          !userJobSnapshotDataFetch ||
          !userDataFetch ||
          !userGroupsDataFetch ? (
            <CircularProgress color="primary" />
          ) : (
            <Typography
              align="center"
              sx={{ typograpyh: { xs: "h6", sm: "h5" } }}
              color="primary"
            >
              Login Complete
            </Typography>
          )}
        </Grid>
        <Grid container item xs={12}>
          {userUIData.userArray.slice(0, 5).map((user, index) => {
            if (index > 5) return null;

            return (
              <Zoom key={user.CharacterID} in={true}>
                <Grid
                  container
                  item
                  xs={6}
                  sm={4}
                  md={2}
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
          {userUIData.userArray.length > 5 ? (
            <Zoom in={true}>
              <Grid
                container
                item
                xs={6}
                sm={4}
                md={2}
                sx={{ marginBottom: "10px" }}
              >
                <Grid item xs={12} align="center">
                  <Avatar
                    variant="circular"
                    sx={{
                      color: "white",
                      bgcolor: "primary.main",
                      height: { xs: "48px", sm: "64px", lg: "128px" },
                      width: { xs: "48px", sm: "64px", lg: "128px" },
                    }}
                  >
                    +{userUIData.userArray.length - 5}
                  </Avatar>
                </Grid>
              </Grid>
            </Zoom>
          ) : null}
        </Grid>
        <Grid
          container
          item
          xs={12}
          sx={{ paddingTop: { xs: "5vh", sm: "10vh" } }}
        >
          <Grid container item xs={6} sm={3}>
            <Grid item xs={12}>
              <Typography
                align="center"
                sx={{ typography: { xs: "caption", sm: "body1" } }}
              >
                Retrieving Character Data
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
                Building Job Planner
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
                Building Group Data
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
                Building Watchlist Data
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
