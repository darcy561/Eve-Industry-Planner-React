import { Box, Link, Paper, Stack, Typography } from "@mui/material";
import { useEffect } from "react";
import GLOBAL_CONFIG from "./global-config-app";
import { refreshAppConfig } from "./Functions/Endpoints/Public/appConfig.js";
import { appShellSetupSectionPaperSx } from "./Context/appShell";
import { LoadingBrandBackdrop, LOGO_SRC } from "./Components/loadingBrand";

const { DEFAULT_DISCORD_INVITE, MAINTENANCE_RECOVERY_POLL_INTERVAL } =
  GLOBAL_CONFIG;

function MaintenanceMode() {
  // The socket is gone while this is shown; this poll is how the tab learns the window ended.
  useEffect(() => {
    const interval = setInterval(() => {
      void refreshAppConfig();
    }, MAINTENANCE_RECOVERY_POLL_INTERVAL * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        width: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <LoadingBrandBackdrop sx={{ flex: 1, width: "100%" }}>
        <Paper
          variant="outlined"
          sx={{
            ...appShellSetupSectionPaperSx,
            maxWidth: 440,
            width: "100%",
            textAlign: "center",
          }}
        >
          <Stack spacing={2} sx={{ alignItems: "center" }}>
            <Box
              component="img"
              src={LOGO_SRC}
              alt="EVE Industry Planner"
              width={88}
              height={88}
              sx={{ display: "block", borderRadius: 2, userSelect: "none" }}
            />
            <Box>
              <Typography variant="h6" color="primary">
                Under maintenance
              </Typography>
              <Typography variant="body2" color="text.secondary">
                EVE Industry Planner is temporarily unavailable. Thank you for
                your patience — the app returns on its own when maintenance ends.
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Status and announcements:{" "}
              <Link
                href={DEFAULT_DISCORD_INVITE}
                target="_blank"
                rel="noopener noreferrer"
                underline="hover"
              >
                Discord
              </Link>
            </Typography>
          </Stack>
        </Paper>
      </LoadingBrandBackdrop>
    </Box>
  );
}

export default MaintenanceMode;
