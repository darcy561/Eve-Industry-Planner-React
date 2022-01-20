import { Grid } from "@mui/material";
import { AccountData } from "./Logged In Components/AccountData";
import { NewTransactions } from "./Logged In Components/NewTransactions";

export function LoggedInHome() {

  return (
    <Grid
      container
      sx={{
        marginTop: "5px",
      }}
      spacing={2}
    >
      <Grid item xs={12} md={6} lg={4}>
        <AccountData />
      </Grid>
      <Grid item xs={12} md={6} lg={8}>
        <NewTransactions/>
      </Grid>
    </Grid>
  );
}
