import { Container, Grid, Paper } from "@mui/material";
import { useContext } from "react";
import { UsersContext } from "../../Context/AuthContext";
import { AccountInfo } from "./accountInfo";
import { AdditionalAccounts } from "./Additional Accounts";

export default function AccountsPage() {
  const { users } = useContext(UsersContext);
  const parentUserIndex = users.findIndex((i) => i.ParentUser);
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
