import { Grid, Grow, Paper, Typography } from "@mui/material";
import { useEffect } from "react";
import { useState } from "react";
import { useContext } from "react";
import { makeStyles } from "@mui/styles";
import { ActiveJobContext } from "../../../Context/JobContext";
import { useGroupManagement } from "../../../Hooks/useGroupManagement";

const useStyles = makeStyles((theme) => ({
  Header: {
    color:
      theme.palette.type === "dark" ? "secondary" : theme.palette.primary.main,
  },
}));

export function OutputJobsPanel({ groupJobs, groupPageRefresh }) {
  const { activeGroup } = useContext(ActiveJobContext);
  const [outputJobs, updateOutputJobs] = useState([]);
  const { calculateCurrentJobBuildCostFromChildren } = useGroupManagement();
  const classes = useStyles();

  useEffect(() => {
    let returnArray = [];
    for (let job of groupJobs) {
      if (job.parentJob.length === 0) {
        returnArray.push(job);
      }
    }
    updateOutputJobs(returnArray);
  }, [groupJobs]);

  if (!groupPageRefresh && activeGroup !== null) {
    return (
      <Paper
        elevation={3}
        square
        sx={{
          marginRight: { md: "10px" },
          marginLeft: { md: "10px" },
          padding: "20px",
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h4" className={classes.Header}>
              Output
            </Typography>
          </Grid>
          {outputJobs.map((job) => {
            let buildCost = calculateCurrentJobBuildCostFromChildren(job);
            return (
              <Grow in={true} key={job.jobID}>
                <Grid container item xs={6} sm={4} md={3}>
                  <Paper
                    elevation={3}
                    square
                    sx={{ padding: "20px", width: "100%" }}
                  >
                    <Grid container item xs={12}>
                      <Grid item xs={3}>
                        <picture>
                          <source
                            media="(max-width:700px)"
                            srcSet={`https://images.evetech.net/types/${job.itemID}/icon?size=32`}
                            alt=""
                          />
                          <img
                            src={`https://images.evetech.net/types/${job.itemID}/icon?size=64`}
                            alt=""
                          />
                        </picture>
                      </Grid>
                      <Grid item xs={9}>
                        <Typography
                          color="secondary"
                          align="center"
                          sx={{
                            minHeight: {
                              xs: "2rem",
                              sm: "3rem",
                              md: "3rem",
                              lg: "4rem",
                            },
                            typography: { xs: "body1", lg: "h6" },
                          }}
                        >
                          {job.name}
                        </Typography>
                      </Grid>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography
                        sx={{ typography: { xs: "body2", md: "body1" } }}
                      >
                        {job.build.products.totalQuantity}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography
                        sx={{ typography: { xs: "body2", md: "body1" } }}
                      >
                        {buildCost.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </Typography>
                    </Grid>
                  </Paper>
                </Grid>
              </Grow>
            );
          })}
        </Grid>
      </Paper>
    );
  } else {
    return <Paper>refresh</Paper>;
  }
}
