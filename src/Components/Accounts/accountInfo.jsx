import { Grid, Paper, Typography } from "@mui/material";
import { useHelperFunction } from "../../Hooks/GeneralHooks/useHelperFunctions";

export function AccountInfo() {
  const { findParentUser } = useHelperFunction();
  const parentUser = findParentUser();

  return (
    <Paper elevation={3} sx={{ padding: "20px" }} square={true}>
      <Grid container>
        <Grid item xs={12} align="center" sx={{ marginBottom: "20px" }}>
          <Typography variant="h6" color="primary">
            Main Account
          </Typography>
        </Grid>
        <Grid container item xs={12}>
          <Grid item xs={3} sx={{ marginBottom: "10px" }}>
            <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
              Character Name:
            </Typography>
          </Grid>
          <Grid item xs={9} align="right">
            <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
              {parentUser.CharacterName}
            </Typography>
          </Grid>
          <Grid item xs={3} sx={{ marginBottom: "10px" }}>
            <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
              Account ID:
            </Typography>
          </Grid>
          <Grid item xs={9} align="right">
            <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
              {parentUser.accountID}
            </Typography>
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
}
