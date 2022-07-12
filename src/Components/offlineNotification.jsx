import { Grid, Paper, Typography } from "@mui/material";
import { useContext } from "react";
import { IsLoggedIn, IsLoggedInContext } from "../Context/AuthContext";
import { EveESIStatusContext } from "../Context/EveDataContext";

export function ESIOffline() {
  const { eveESIStatus } = useContext(EveESIStatusContext);
  const { IsLoggedIn } = useContext(IsLoggedInContext);

  if (!eveESIStatus.serverStatus.online && IsLoggedIn) {
    return (
      <Grid item xs={12}>
        <Paper
          elevation={2}
          square={true}
          sx={{
            padding: "20px",
            marginRight: { md: "10px" },
            marginLeft: { md: "10px" },
          }}
        >
          <Typography
            color="error"
            align="center"
            sx={{ typography: { xs: "body1", sm: "h6" } }}
          >
            Trouble connecting to the Eve Online servers.
          </Typography>
          <Typography
            color="error"
            align="center"
            sx={{ typography: { xs: "caption", sm: "body2" } }}
          >
            ESI data may be missing or incorrect.
          </Typography>
        </Paper>
      </Grid>
    );
  } else return null;
}
