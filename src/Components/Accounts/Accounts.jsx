import { Container, Grid, Paper } from "@mui/material";
import { AccountInfo } from "./accountInfo";
import { AdditionalAccounts } from "./Additional Accounts";
import { useHelperFunction } from "../../Hooks/GeneralHooks/useHelperFunctions";
import { Header } from "../Header";
import { Footer } from "../Footer/Footer";

export default function AccountsPage({ colorMode }) {
  const { findParentUserIndex } = useHelperFunction();
  const parentUserIndex = findParentUserIndex();
  return (
    <>
      <Header colorMode={colorMode} />
      <Container disableGutters maxWidth="false">
        <Paper
          elevation={3}
          sx={{
            padding: "20px",
            marginTop: 10,
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
        <Footer />
      </Container>
    </>
  );
}
