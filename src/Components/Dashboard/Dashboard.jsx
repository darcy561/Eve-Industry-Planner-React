import { Grid } from "@mui/material";
import { AccountData } from "./Components/AccountData";
import { NewTransactions } from "./Components/NewTransactions";
import { TutorialDashboard } from "./Components/dashboardTutorial";
import { useContext } from "react";
import { UsersContext } from "../../Context/AuthContext";

export function Dashboard() {
  const { users } = useContext(UsersContext);

  const parentUser = users.find((i) => i.ParentUser === true);

  return (
    <Grid
      container
      sx={{
        marginTop: "5px",
      }}
      spacing={2}
    >
      {!parentUser.settings.layout.hideTutorials && (
        <Grid item xs={12}>
          <TutorialDashboard />
        </Grid>
      )}
      <Grid item xs={12} md={6} lg={4}>
        <AccountData />
      </Grid>
      <Grid item xs={12} md={6} lg={8}>
        <NewTransactions />
      </Grid>
    </Grid>
  );
}
