import { Grid } from "@mui/material";
import { AccountInfo } from "./accountInfo";
import { AdditionalAccounts } from "./AdditionalAccounts";
import { CitadelNamesCommunityPanel } from "./CitadelNamesCommunityPanel";

export default function AccountsPage() {
  return (
    <>
      <Grid container spacing={2}>
        <Grid size={12}>
          <AccountInfo />
        </Grid>
        <Grid size={12}>
          <CitadelNamesCommunityPanel />
        </Grid>
        <Grid size={12}>
          <AdditionalAccounts />
        </Grid>
      </Grid>
    </>
  );
}
