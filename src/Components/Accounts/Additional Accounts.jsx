import { Button, Grid, Paper, Typography } from "@mui/material";
import { useContext } from "react";
import { UsersContext } from "../../Context/AuthContext";
import { ApiJobsContext } from "../../Context/JobContext";
import { SnackBarDataContext } from "../../Context/LayoutContext";
import { useEveApi } from "../../Hooks/useEveApi";
import { useFirebase } from "../../Hooks/useFirebase";
import { AccountEntry } from "./AccountEntry";

export function AdditionalAccounts() {
  const { users, updateUsers } = useContext(UsersContext);
  const { updateApiJobs } = useContext(ApiJobsContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const {
    CharacterSkills,
    IndustryJobs,
    MarketOrders,
    HistoricMarketOrders,
    BlueprintLibrary,
    WalletTransactions,
    WalletJournal,
  } = useEveApi();
  const { updateMainUserDoc } = useFirebase();
  let newUser = null;
  const parentUser = users.find((i) => i.ParentUser);

  const handleAdd = async () => {
    localStorage.setItem("AddAccount", true);
    localStorage.setItem("AddAccountComplete", false);
    window.open(
      `https://login.eveonline.com/v2/oauth/authorize/?response_type=code&redirect_uri=${encodeURIComponent(
        process.env.REACT_APP_eveCallbackURL
      )}&client_id=${process.env.REACT_APP_eveClientID}&scope=${
        process.env.REACT_APP_eveScope
      }&state=/`,
      "_blank"
    );
    window.addEventListener("storage", importNewAccount);
    setTimeout(() => {
      if (
        localStorage.getItem("AddAccount") === "true" ||
        localStorage.getItem("AddAccountComplete") === "false"
      ) {
        window.removeEventListener("storage", importNewAccount);
        localStorage.removeItem("AddAccount");
        localStorage.removeItem("AddAccountComplete");
      }
    }, 180000);
    // 3 mins
  };

  const importNewAccount = async (event) => {
    if (
      localStorage.getItem("AddAccountComplete") &&
      localStorage.getItem("AdditionalUser") !== null &&
      newUser === null
    ) {
      newUser = JSON.parse(localStorage.getItem("AdditionalUser"));
      const [
        skills,
        indJobs,
        orders,
        histOrders,
        blueprints,
        transactions,
        journal,
      ] = await Promise.all([
        CharacterSkills(newUser),
        IndustryJobs(newUser, parentUser),
        MarketOrders(newUser),
        HistoricMarketOrders(newUser),
        BlueprintLibrary(newUser),
        WalletTransactions(newUser),
        WalletJournal(newUser),
      ]);
      newUser.apiSkills = skills
      newUser.apiJobs = indJobs
      newUser.apiOrders = orders
      newUser.apiHistOrders = histOrders
      newUser.apiBlueprints = blueprints
      newUser.apiTransactions = transactions
      newUser.apiJournal = journal
      localStorage.removeItem("AddAccount");
      localStorage.removeItem("AddAccountComplete");
      localStorage.removeItem("AdditionalUser");
      parentUser.accountRefreshTokens.push({
        CharacterHash: newUser.CharacterHash,
        rToken: newUser.rToken,
      });
      updateUsers((prev) => [...prev, newUser]);
      updateApiJobs((prev) => prev.concat(newUser.apiJobs));
      updateMainUserDoc();
      setSnackbarData((prev) => ({
        ...prev,
        open: true,
        message: `${newUser.CharacterName} Imported`,
        severity: "success",
        autoHideDuration: 3000,
      }));
      window.removeEventListener("storage", importNewAccount);
    }
  };

  return (
    <Paper elevation={3} sx={{ padding: "20px" }} square={true}>
      <Grid container>
        <Grid item xs={12}>
          <Typography variant="h6" align="center" color="primary">
            Additional Accounts
          </Typography>
        </Grid>
        <Grid item xs={12} align="right">
          <Button variant="contained" size="small" onClick={handleAdd}>
            Add Account
          </Button>
        </Grid>
        <Grid container item xs={12} sx={{ marginTop: "20px" }}>
          {users.map((user) => {
            if (!user.ParentUser) {
              return <AccountEntry key={user.CharacterHash} user={user} />;
            } else return null;
          })}
        </Grid>
      </Grid>
    </Paper>
  );
}
