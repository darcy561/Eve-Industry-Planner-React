import { Container, Grid, Paper } from "@mui/material";
import { AccountInfo } from "./accountInfo";
import { AdditionalAccounts } from "./Additional Accounts";
import { useHelperFunction } from "../../Hooks/GeneralHooks/useHelperFunctions";

export default function AccountsPage() {
  const { findParentUserIndex } = useHelperFunction();
  const parentUserIndex = findParentUserIndex();
  return (
    <Container disableGutters maxWidth="false">
      <Paper
        elevation={3}
        sx={{
          padding: "20px",
          marginTop: "20px",
          marginLeft: { md: "10px" },
          marginRight: { md: "10px" },
          marginBottom: "20px",
        }}
        square={true}
      >
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <AccountInfo parentUserIndex={parentUserIndex} />
          </Grid>
          <Grid item xs={12}>
            <AdditionalAccounts parentUserIndex={parentUserIndex} />
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}
