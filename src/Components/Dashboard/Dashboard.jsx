import { Grid } from "@mui/material";
import { AccountData } from "./Components/AccountData";
import { NewTransactions } from "./Components/NewTransactions";
import { TutorialDashboard } from "./Components/dashboardTutorial";
import { ESIOffline } from "../offlineNotification";
import { ItemWatchPanel } from "./Components/ItemWatch/ItemWatchPanel";
import { ActiveCharacterSlots } from "./Components/characterSlots";

function Dashboard() {
  return (
    <Grid
      container
      sx={{
        marginTop: "5px",
      }}
      spacing={2}
    >
      <TutorialDashboard />
      <ESIOffline />
      <Grid container item spacing={2} xs={12} md={6} lg={4}>
        <Grid item xs={12}>
          <AccountData />
        </Grid>
        <Grid item xs={12}>
          <ActiveCharacterSlots />
        </Grid>
      </Grid>
      <Grid item xs={12} md={6} lg={8}>
        <NewTransactions />
      </Grid>
      <Grid item xs={12}>
        <ItemWatchPanel />
      </Grid>
    </Grid>
  );
}

export default Dashboard;
