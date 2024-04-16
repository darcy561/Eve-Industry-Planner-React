import { Grid } from "@mui/material";
import { AccountData } from "./Components/AccountData";
import { NewTransactions } from "./Components/NewTransactions";
import { TutorialDashboard } from "./Components/dashboardTutorial";
import { ESIOffline } from "../offlineNotification";
import { ItemWatchPanel } from "./Components/ItemWatch/ItemWatchPanel";
import { ActiveCharacterSlots } from "./Components/characterSlots";
import { Header } from "../Header";
import { Footer } from "../Footer/Footer";

function Dashboard({ colorMode }) {
  return (
    <>
      <Header colorMode={colorMode} />
      <Grid
        container
        sx={{
          marginTop: 8,
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
        <Footer/>
      </Grid>
    </>
  );
}

export default Dashboard;
