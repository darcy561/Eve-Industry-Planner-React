import {
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  Typography,
} from "@mui/material";
import { useContext, useEffect, useMemo, useState } from "react";
import { ArchivedJobsContext } from "../../Context/JobContext";
import { useFirebase } from "../../Hooks/useFirebase";
import { getAnalytics, logEvent } from "firebase/analytics";
import { UsersContext } from "../../Context/AuthContext";

export function ArchiveBpData({ archiveOpen, updateArchiveOpen, bpData }) {
  const { updateArchivedJobs } = useContext(ArchivedJobsContext);
  const { users } = useContext(UsersContext);
  const [jobData, updateJobData] = useState(undefined);
  const [getData, updateGetData] = useState(true);
  const { getArchivedJobData } = useFirebase();
  const analytics = getAnalytics();

  const parentUser = useMemo(() => {
    return users.find((i) => i.ParentUser);
  }, [users]);

  useEffect(() => {
    async function getArchiveData() {
      if (archiveOpen) {
        let newArchivedJobsArray = await getArchivedJobData(bpData.itemID);
        let data = newArchivedJobsArray.find((i) => i.typeID === bpData.itemID);
        logEvent(analytics, "View Archived Job Data", {
          UID: parentUser.accountID,
        });
        updateGetData(false);
        updateJobData(data);
        updateArchivedJobs(newArchivedJobsArray);
      }
    }
    getArchiveData();
  }, [archiveOpen]);

  return (
    <Dialog
      open={archiveOpen}
      onClose={() => {
        updateArchiveOpen(false);
      }}
      sx={{ padding: "20px" }}
    >
      <DialogTitle align="center" color="primary" sx={{ marginBottom: "20px" }}>
        {bpData.name} Archived Data
      </DialogTitle>
      {getData && (
        <DialogContent>
          <Grid container>
            <Grid item xs={12} align="center">
              <CircularProgress color="primary" />
            </Grid>
            <Grid item xs={12} align="center">
              <Typography>Loading...</Typography>
            </Grid>
          </Grid>
        </DialogContent>
      )}

      {jobData !== undefined ? (
        <DialogContent>
          <Grid container>
            <Grid container item xs={12}>
              <Grid item xs={12} sm={6}>
                <Typography>Total Jobs:</Typography>
              </Grid>
              <Grid item xs={12} sm={6} align="right">
                <Typography>{jobData.totalJobs}</Typography>
              </Grid>
            </Grid>
            <Grid container item xs={12}>
              <Grid item xs={12} sm={6}>
                <Typography>Total Items Built:</Typography>
              </Grid>
              <Grid item xs={12} sm={6} align="right">
                <Typography>
                  {jobData.itemBuildCount.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </Typography>
              </Grid>
            </Grid>
            <Grid container item xs={12}>
              <Grid item xs={12} sm={6}>
                <Typography>Average Item Cost:</Typography>
              </Grid>
              <Grid item xs={12} sm={6} align="right">
                <Typography>
                  {(
                    ((jobData.jobCostTotal / jobData.itemBuildCount +
                      Number.EPSILON) *
                      100) /
                    100
                  ).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Typography>
              </Grid>
            </Grid>
            <Grid container item xs={12}>
              <Grid item xs={12} sm={6}>
                <Typography>Job Cost Total:</Typography>
              </Grid>
              <Grid item xs={12} sm={6} align="right">
                <Typography>
                  {jobData.jobCostTotal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Typography>
              </Grid>
            </Grid>
            <Grid container item xs={12}>
              <Grid item xs={12} sm={6}>
                <Typography>Sales Total:</Typography>
              </Grid>
              <Grid item xs={12} sm={6} align="right">
                <Typography>
                  {jobData.salesTotal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Typography>
              </Grid>
            </Grid>
            <Grid container item xs={12}>
              <Grid item xs={12} sm={6}>
                <Typography>Brokers Fee Total:</Typography>
              </Grid>
              <Grid item xs={12} sm={6} align="right">
                <Typography>
                  {jobData.brokersFeeTotal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Typography>
              </Grid>
            </Grid>
            <Grid container item xs={12}>
              <Grid item xs={12} sm={6}>
                <Typography>Transaction Fee Total:</Typography>
              </Grid>
              <Grid item xs={12} sm={6} align="right">
                <Typography>
                  {jobData.transactionFeeTotal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Typography>
              </Grid>
            </Grid>
            <Grid container item xs={12}>
              <Grid item xs={12} sm={6}>
                <Typography>Profit/Loss:</Typography>
              </Grid>
              <Grid item xs={12} sm={6} align="right">
                <Typography
                  color={jobData.profitLoss >= 0 ? "primary" : "error"}
                >
                  {jobData.profitLoss.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
      ) : (
        <DialogContent>
          <Grid align="center">
            You have no archived jobs matching this item type.
          </Grid>
        </DialogContent>
      )}
    </Dialog>
  );
}
