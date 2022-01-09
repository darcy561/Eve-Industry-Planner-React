import React from "react";
import { Box, Divider, Grid, Icon, Paper, Typography } from "@mui/material";
import { useMediaQuery, useTheme } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

export function LoggedOutHome() {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Grid
      container
      sx={{
        marginTop: "5px",
      }}
      spacing={2}
    >
      <Grid item xs={12}>
        <Paper
          elevation={3}
          sx={{
            padding: "20px",
            marginLeft: {
              xs: "5px",
              md: "10px",
            },
            marginRight: {
              xs: "5px",
              md: "10px",
            },
          }}
          square={true}
        >
          <Grid item xs={12}>
            <Typography
              variant="body2"
              align="center"
              color="primary"
              sx={{ fontStyle: "italic", marginBottom: "10px" }}
            >
              Making the spreadsheet, so you dont have to!
            </Typography>
            <Typography
              variant="h6"
              align="center"
              color="secondary"
              sx={{ textDecoration: "underline" }}
            >
              Alpha Release
            </Typography>
          </Grid>
          <Grid container item xs={12} sx={{ marginTop: "30px" }}>
            <Typography paragraph variant="body1" align="left">
              Welcome to Eve Industry Planner a new way to plan and manage your
              industry jobs quickly so that you can spend more time in game
              doing the things you enjoy! {<br />}
              {<br />}
              As many of the longer standing members of the Eve Online community
              will know, having a good spreadsheet to manage your industry jobs
              is important and extremely useful. Being able to know exactly how
              much something cost you to build is vital when it comes to selling
              your items for the right price in the right location, get it wrong
              and you could loose alot of ISK!
              {<br />}
              For the newer plays or the more expierenced players who are
              wanting to get involved with the industry life style then Eve
              Industry Planner is here to help you manage this, weather you are
              infront of your PC, on the bus or just sat at work wondering if
              your items have sold. Using the data provided by the Eve ESI you
              can keep up to date with your sell orders.
            </Typography>
            <Typography paragraph variant="body1" align="left">
              Eve Industry Planner takes the whole process and breaks it down
              into 5 simple steps:
            </Typography>
          </Grid>
          <Grid container item xs={12}>
            <Grid container item xs={12}>
              <Grid item xs={3} sm={0} sx={{display:{xs:"block", sm:"none"}}}/>
              <Grid item xs={6} sm={12} >
                <Paper
                  elevation={1}
                  square={true}
                  sx={{
                    padding: "20px",
                    marginTop: "10px",
                    marginBottom: "30px",
                  }}
                >
                  <Grid container item xs={12} columns={9}>
                    <Grid item xs={12} sm={1} align="center">
                      <Typography variant="h6" color="primary">
                        Plan
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={1} align="center">
                      {mobile ? (
                        <Icon color="secondary">
                          <ArrowDownwardIcon />
                        </Icon>
                      ) : (
                        <Icon color="secondary">
                          <ArrowForwardIcon />
                        </Icon>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={1} align="center">
                      <Typography variant="h6" color="primary">
                        Purchase
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={1} align="center">
                    {mobile ? (
                        <Icon color="secondary">
                          <ArrowDownwardIcon />
                        </Icon>
                      ) : (
                        <Icon color="secondary">
                          <ArrowForwardIcon />
                        </Icon>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={1} align="center">
                      <Typography variant="h6" color="primary">
                        Build
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={1} align="center">
                    {mobile ? (
                        <Icon color="secondary">
                          <ArrowDownwardIcon />
                        </Icon>
                      ) : (
                        <Icon color="secondary">
                          <ArrowForwardIcon />
                        </Icon>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={1} align="center">
                      <Typography variant="h6" color="primary">
                        Review
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={1} align="center">
                    {mobile ? (
                        <Icon color="secondary">
                          <ArrowDownwardIcon />
                        </Icon>
                      ) : (
                        <Icon color="secondary">
                          <ArrowForwardIcon />
                        </Icon>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={1} align="center">
                      <Typography variant="h6" color="primary">
                        Sell
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
              <Grid item xs={3} sm={0} sx={{display:{xs:"block", sm:"none"}}}></Grid>
            </Grid>
            <Grid container item xs={12}>
              <Grid item xs={12} sm={3}>
                <Typography paragraph variant="body1">
                  <i>
                    <b>Planning</b>
                  </i>{" "}
                  - Here we can work out how many runs, job slots, the different
                  structure types, all of this will is used to calculate the
                  resources to create your item.
                </Typography>
              </Grid>
              <Grid item xs={9} align="center">
                <img src="\images\loggedOutHome\planningStepImage.png" alt="" />
              </Grid>
            </Grid>
            <Grid container item xs={12}>
              <Grid item xs={12} sm={9} align="center">
                <img
                  src="\images\loggedOutHome\purchasingStepImage.png"
                  alt=""
                />
              </Grid>
              <Grid item xs={3}>
                <Typography paragraph variant="body1">
                  <i>
                    <b>Purchasing</b>
                  </i>{" "}
                  - Once you know what you are building then it is time to go
                  out and purchase the items that you need. Enter the item costs
                  for each material until you have all the materials you need
                  and your total raw materials cost.
                </Typography>
              </Grid>
            </Grid>
            <Grid item xs={12}>
              <Typography paragraph variant="body1">
                <i>
                  <b>Building</b>
                </i>{" "}
                - Set your industry job running in the game and it will appear
                and import the installation costs automatically for you and
                display the completion time/date.
              </Typography>
            </Grid>
            <Grid item xs={12}></Grid>

            <Grid item xs={12}>
              <Typography paragraph variant="body1">
                <i>
                  <b>Complete</b>
                </i>{" "}
                - Once your job is complete it is time to calculate the total
                build costs and any extra costs that you may need too add or
                remove before moving it to the final stage, the fun part.
              </Typography>
            </Grid>
            <Grid item xs={12}></Grid>
            <Grid item xs={12}>
              <Typography paragraph variant="body1">
                <i>
                  <b>Sale</b>
                </i>{" "}
                - This is the part where you can make some money, hopefully. Add
                your market orders and the relavent transactions to your job to
                calculate your profit or loss. This includes your brookers fees
                and transaction tax to give you a complete insight into the cost
                of your job.
              </Typography>
            </Grid>
            <Grid item xs={12}></Grid>
          </Grid>
          <Grid item xs={12} sx={{ marginTop: "10px" }}>
            <Typography paragraph variant="body1" align="left">
              More Text Here
            </Typography>
          </Grid>
        </Paper>
      </Grid>

    </Grid>
  );
}
