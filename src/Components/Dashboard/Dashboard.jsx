import { Grid } from "@mui/material";
import { AccountData } from "./Components/AccountData";
import { NewTransactions } from "./Components/NewTransactions";
import {TutorialDashboard} from "./Components/dashboardTutorial"

export function Dashboard() {

  return (
    <Grid
      container
      sx={{
        marginTop: "5px",
      }}
      spacing={2}
    >
      <Grid item xs={12}>
        <TutorialDashboard/>
      </Grid>
      <Grid item xs={12} md={6} lg={4}>
        <AccountData />
      </Grid>
      <Grid item xs={12} md={6} lg={8}>
        <NewTransactions/>
      </Grid>
    </Grid>
  );
}
