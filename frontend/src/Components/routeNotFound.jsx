import { Box, Paper, Stack, Typography } from "@mui/material";
import { appShellSimpleLoadingSurfaceSx } from "../Context/appShell";
import useUsersStore from "../Zustand/usersStore";
import { RouterButton } from "../Styled Components/Navigation/routerControls";

/**
 * What a reader sees when the thing a URL names is not there.
 *
 * A route's loader throws to here when the job or group it was asked for cannot be
 * found. It names what happened rather than quietly redirecting somewhere else, which
 * is what a reader needs to tell a bad link from an empty planner.
 *
 * What happened differs by reader. Work built without an account is held for the visit
 * and never sent anywhere, so the usual reason a signed-out reader lands here is a
 * refresh rather than a stale link — and telling them something was deleted would be
 * untrue as well as unhelpful.
 */
export function RouteNotFound() {
  const isLoggedIn = useUsersStore((state) => state.account.isLoggedIn);

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        p: 3,
      }}
    >
      <Paper
        variant="outlined"
        elevation={0}
        sx={{ ...appShellSimpleLoadingSurfaceSx, p: 4, maxWidth: 420 }}
      >
        <Stack spacing={2} sx={{ alignItems: "center", textAlign: "center" }}>
          <Typography variant="h6">We could not find that</Typography>
          <Typography variant="body2" color="text.secondary">
            {isLoggedIn
              ? "The link may be out of date, or what it points at may have been deleted."
              : "Work you build without an account is kept only while you are here, so a reload clears it. The link may also be out of date."}
          </Typography>
          <RouterButton to="/jobplanner" variant="contained" size="small">
            Back to the job planner
          </RouterButton>
        </Stack>
      </Paper>
    </Box>
  );
}
