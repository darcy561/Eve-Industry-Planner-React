import React from "react";
import { Container, Grid } from "@mui/material";
import { BuildStats } from "./Page 4 Components/buildStats";
import { ExtrasList } from "./Page 4 Components/extras";

export function EditPage4({ setJobModified }) {
  return (
    <Container disableGutters maxWidth="false" >
      <Grid container direction="row" spacing={2}>
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
