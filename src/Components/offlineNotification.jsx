import { useContext } from "react";
import { Box, Grid, Paper, Typography } from "@mui/material";
import { IsLoggedInContext } from "../Context/AuthContext";
import { EveESIStatusContext } from "../Context/EveDataContext";
import {
  LARGE_TEXT_FORMAT,
  STANDARD_TEXT_FORMAT,
} from "../Context/defaultValues";

export function ESIOffline() {
  const { eveESIStatus } = useContext(EveESIStatusContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);

  if (!eveESIStatus.serverStatus.online && isLoggedIn) {
    return (
      <Box
        sx={{
          display: "flex",
          flexGrow: 1,
          width: "100%",
          height: "100%",
        }}
      >
        <Paper
          elevation={3}
          square
          sx={{
            width: "100%",
            padding: "20px",
          }}
        >
          <Typography
            color="error"
            align="center"
            sx={{ typography: LARGE_TEXT_FORMAT }}
          >
            Trouble connecting to the Eve Online servers.
          </Typography>
          <Typography
            color="error"
            align="center"
            sx={{ typography: STANDARD_TEXT_FORMAT }}
          >
            ESI data may be missing or incorrect.
          </Typography>
        </Paper>
      </Box>
    );
  }
}
