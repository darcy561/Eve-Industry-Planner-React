import React, { useContext } from "react";
import { Container, Grid } from "@mui/material";
import { BuildStats } from "./Page 4 Components/buildStats";
import { ExtrasList } from "./Page 4 Components/extras";
import { TutorialStep4 } from "./Page 4 Components/tutorialStep4";
import { UsersContext } from "../../../../Context/AuthContext";

export function EditPage4({ setJobModified }) {
  const { users } = useContext(UsersContext);

  const parentUser = users.find((i) => i.ParentUser === true);
  return (
    <Container disableGutters maxWidth="false" >
      <Grid container direction="row" spacing={2}>
        {!parentUser.settings.layout.hideTutorials && (
          <Grid item xs={12}>
            <TutorialStep4 />
          </Grid>
        )}
        <Grid item xs={12} md={6}>
          <ExtrasList setJobModified={setJobModified} />
        </Grid>
        <Grid item xs={12} md={6}>
          <BuildStats setJobModified={setJobModified} />
        </Grid>
      </Grid>
    </Container>
  );
}
