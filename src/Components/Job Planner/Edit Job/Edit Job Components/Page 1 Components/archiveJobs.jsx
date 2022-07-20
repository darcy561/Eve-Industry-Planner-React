import { Grid, Paper, Icon, Typography, Tooltip } from "@mui/material";
import { useContext } from "react";
import {
  ActiveJobContext,
  ArchivedJobsContext,
} from "../../../../../Context/JobContext";
import DoneIcon from "@mui/icons-material/Done";
import CloseIcon from "@mui/icons-material/Close";
import { jobTypes } from "../../../../../Context/defaultValues";

export function ArchiveJobs() {
  const { activeJob } = useContext(ActiveJobContext);
  const { archivedJobs } = useContext(ArchivedJobsContext);

  const archiveData = archivedJobs.find((i) => i.typeID === activeJob.itemID);
  
  return (
    <Paper
      elevation={3}
      sx={{
        minWidth: "100%",
        padding: { xs: "10px", sm: "20px" },
      }}
      square={true}
    >
      <Grid container direction="row">
        <Grid container item direction="row" sx={{ marginBottom: "10px" }}>
          <Grid item xs={12}>
            <Typography variant="h6" color="primary" align="center">
              Archived Job Data
            </Typography>
          </Grid>
        </Grid>
        <Grid container item xs={12} sx={{ marginBottom: "20px" }}>
          {activeJob.jobType === jobTypes.manufacturing ? (
            <Grid item xs={4} sm={2}>
              <Typography
                align="center"
                sx={{ typography: { xs: "caption", sm: "body2" } }}
              >
                Blueprint ME Used
              </Typography>
            </Grid>
          ) : null}
          <Grid
            item
            xs={0}
            sm={activeJob.jobType === jobTypes.reaction ? 3 : 2}
            sx={{ display: { xs: "none", sm: "block" } }}
          >
            <Typography
              align="center"
              sx={{ typography: { xs: "caption", sm: "body2" } }}
            >
              Total Items Produced
            </Typography>
          </Grid>
          <Grid item xs={4} sm={3}>
            <Typography
              align="center"
              sx={{ typography: { xs: "caption", sm: "body2" } }}
            >
              Total Job Cost
            </Typography>
          </Grid>
          <Grid item xs={4} sm={2}>
            <Typography
              align="center"
              sx={{ typography: { xs: "caption", sm: "body2" } }}
            >
              Job Cost Per Item
            </Typography>
          </Grid>
          <Grid
            item
            xs={activeJob.jobType === jobTypes.reaction ? 4 : 0}
            sm={activeJob.jobType === jobTypes.reaction ? 3 : 2}
            sx={{
              display: {
                xs: activeJob.jobType === jobTypes.reaction ? "block" : "none",
                sm: "block",
              },
            }}
          >
            <Tooltip
              title="Jobs without any sales data will always display 0"
              arrow
              placement="top"
            >
              <Typography
                align="center"
                sx={{
                  typography: { xs: "caption", sm: "body2" },
                }}
              >
                Profit/Loss
              </Typography>
            </Tooltip>
          </Grid>
          <Grid
            item
            xs={0}
            sm={1}
            sx={{ display: { xs: "none", sm: "block" } }}
          >
            <Tooltip
              title="Indicates weather this the job had a parent that it was used to construct."
              arrow
              placement="top"
            >
              <Typography
                align="center"
                sx={{ typography: { xs: "caption", sm: "body2" } }}
              >
                Child Job
              </Typography>
            </Tooltip>
          </Grid>
        </Grid>
        <Grid container item xs={12}>
          {archiveData !== undefined ? (
            archiveData.dataSnapshots.map((entry) => {
              return (
                <Grid key={entry.jobID} container item xs={12}>
                  {activeJob.jobType === jobTypes.manufacturing ? (
                    <Grid item xs={4} sm={2}>
                      <Typography
                        align="center"
                        sx={{ typography: { xs: "caption", sm: "body2" } }}
                      >
                        {entry.bpME}
                      </Typography>
                    </Grid>
                  ) : null}
                  <Grid
                    item
                    xs={0}
                    sm={activeJob.jobType === jobTypes.reaction ? 3 : 2}
                    sx={{ display: { xs: "none", sm: "block" } }}
                  >
                    <Typography
                      align="center"
                      sx={{
                        typography: { xs: "caption", sm: "body2" },
                      }}
                    >
                      {entry.totalProduced.toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </Typography>
                  </Grid>
                  <Grid item xs={4} sm={3}>
                    <Typography
                      align="center"
                      sx={{ typography: { xs: "caption", sm: "body2" } }}
                    >
                      {entry.totalJobCost.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Typography>
                  </Grid>
                  <Grid item xs={4} sm={2}>
                    <Typography
                      align="center"
                      sx={{ typography: { xs: "caption", sm: "body2" } }}
                    >
                      {entry.totalCostPerItem.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Typography>
                  </Grid>
                  <Grid
                    item
                    xs={activeJob.jobType === jobTypes.reaction ? 4 : 0}
                    sm={activeJob.jobType === jobTypes.reaction ? 3 : 2}
                    sx={{
                      display: {
                        xs:
                          activeJob.jobType === jobTypes.reaction
                            ? "block"
                            : "none",
                        sm: "block",
                      },
                    }}
                  >
                    <Typography
                      align="center"
                      sx={{
                        typography: { xs: "caption", sm: "body2" },
                      }}
                    >
                      {entry.profitLoss.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Typography>
                  </Grid>
                  <Grid
                    item
                    xs={0}
                    sm={1}
                    align="center"
                    sx={{ display: { xs: "none", sm: "block" } }}
                  >
                    {entry.childJob ? (
                      <Icon fontSize="small" color="success">
                        <DoneIcon />
                      </Icon>
                    ) : (
                      <Icon fontSize="small" color="error">
                        <CloseIcon />
                      </Icon>
                    )}
                  </Grid>
                </Grid>
              );
            })
          ) : (
            <Grid item xs={12}>
              <Typography sx={{ typography: { xs: "caption", sm: "body2" } }} align="center">
                No Archived Job Data To Display
              </Typography>
            </Grid>
          )}
        </Grid>
      </Grid>
    </Paper>
  );
}
