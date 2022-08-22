import { Container, Grid, Paper } from "@mui/material";
import { useContext } from "react";
import { UsersContext } from "../../Context/AuthContext";
import { EditJobSettings } from "./SettingsModules/editJobSettings";
import { LayoutSettings } from "./SettingsModules/layoutSettings";
import { ManuStrutures } from "./SettingsModules/manufacturingStructures";
import { ReactionStrutures } from "./SettingsModules/reactionStructures";

export default function SettingsPage() {
  const { users } = useContext(UsersContext);
  const parentUserIndex = users.findIndex((i) => i.ParentUser === true);
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
          <Grid item xs={12} md={6}>
            <LayoutSettings parentUserIndex={parentUserIndex} />
          </Grid>
          <Grid item xs={12} md={6}>
            <EditJobSettings parentUserIndex={parentUserIndex} />
          </Grid>
          <Grid item xs={12} md={6}>
            <ManuStrutures parentUserIndex={parentUserIndex} />
          </Grid>
          <Grid item xs={12} md={6}>
            <ReactionStrutures parentUserIndex={parentUserIndex} />
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}
