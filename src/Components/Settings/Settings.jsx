import { Container, Grid, Paper, Typography } from "@mui/material";
import { useContext } from "react";
import { IsLoggedInContext, UsersContext } from "../../Context/AuthContext";
import { AccountInfo } from "./SettingsModules/accountInfo";
import { EditJobSettings } from "./SettingsModules/editJobSettings";
import { LayoutSettings } from "./SettingsModules/layoutSettings";

export function SettingsPage() {
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { users } = useContext(UsersContext);
  const parentUserIndex = users.findIndex((i) => i.ParentUser === true);
  if (isLoggedIn) {
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
            <Grid item xs={12} md={4}>
              <AccountInfo />
            </Grid>
            <Grid item xs={12} md={4}>
              <LayoutSettings parentUserIndex={parentUserIndex} />
            </Grid>
            <Grid item xs={12} md={4}>
              <EditJobSettings parentUserIndex={parentUserIndex} />
            </Grid>
          </Grid>
        </Paper>
      </Container>
    );
  } else {
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
          <Grid container>
            <Grid item xs={12} align="center">
              <Typography variant="h4" color="primary" align="center">
                Nope
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    );
  }
}
