import React from "react";
import { Container, Grid, Typography } from "@mui/material";
import { HeaderBanner } from "./Logged Out Components/headerBanner";
import { IconBanner } from "./Logged Out Components/IconBanner";

export function LoggedOutHome() {
  return (
    <Container disableGutters maxWidth="false">
      <Grid container>
        <Grid item xs={12}>
          <HeaderBanner />
        </Grid>
        <Grid container item xs={12}>
          <IconBanner />
        </Grid>
        <Grid
          container
          item
          xs={12}
          sx={{ margin: { xs: "15px 10px", sm: "15px 5%" } }}
        >
          <Grid item xs={12} lg={4}>
            <Typography
              paragraph
              wrap="wrap"
              variant="body1"
              align="left"
              sx={{ paddingTop: { lg: "5%" } }}
            >
              Eve Industry Planner is a new way to plan and manage your industry
              jobs quickly, so that you can spend more time in game doing the
              things that you enjoy!
              {<br />}
              {<br />}
              As many of the longer standing members of the Eve Online community
              will know, having a good spreadsheet to manage your industry jobs
              is important and extremely useful. Being able to know exactly how
              much something has cost you to build is vital when it comes to selling
              your items for the right price in the right location, get it wrong
              and you could lose a lot of ISK!
              {<br />}
              {<br />}
              For the newer plays or the more experienced players of the game
              who are wanting to get involved with the industry lifestyle. Eve
              Industry Planner is here to help you manage your jobs easily,
              weather you are In front of your PC, on the bus or just sat at
              work. Using the data provided by the Eve ESI you can keep up to
              date with your industry jobs and sell orders.
            </Typography>
          </Grid>
          <Grid
            container
            item
            xs={12}
            lg={8}
            justifyContent="center"
            alignItems="center"
            sx={{ paddingLeft: { lg: "20px" } }}
          >
            <img
              src="\images\loggedOutHome\planningStepImage.png"
              alt=""
              style={{ width: "100%", height: "auto" }}
            />
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
}
