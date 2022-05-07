import {
  Button,
  CircularProgress,
  Grid,
  IconButton,
  Paper,
  Popover,
  Typography,
} from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { EvePricesContext } from "../../../../../Context/EveDataContext";
import {
  ActiveJobContext,
  JobArrayContext,
} from "../../../../../Context/JobContext";
import { useFirebase } from "../../../../../Hooks/useFirebase";
import { useJobManagement } from "../../../../../Hooks/useJobManagement";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import { IsLoggedInContext } from "../../../../../Context/AuthContext";

export function ChildJobPopover({
  displayPopover,
  updateDisplayPopover,
  material,
  marketSelect,
  listingSelect,
  jobModified,
}) {
  const { jobArray } = useContext(JobArrayContext);
  const { evePrices, updateEvePrices } = useContext(EvePricesContext);
  const { activeJob } = useContext(ActiveJobContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { downloadCharacterJobs, uploadJob, getItemPrices } = useFirebase();
  const { replaceSnapshot, closeEditJob, openEditJob } = useJobManagement();
  const [jobImport, updateJobImport] = useState(false);
  const [jobDisplay, setJobDisplay] = useState(0);
  const [childJobObjects, updateChildJobObjects] = useState([]);

  useEffect(async () => {
    if (displayPopover !== null) {
      let jobs = [];
      let priceRequest = new Set();
      for (let id of material.childJob) {
        let childJob = jobArray.find((i) => i.jobID === id);
        if (childJob.isSnapshot) {
          childJob = await downloadCharacterJobs(childJob);
          childJob.isSnapshot = false;
          replaceSnapshot(childJob);
        }
        if (!childJobObjects.some((i) => i.jobID === childJob.jobID)) {
          jobs.push(childJob);
        }
      }

      updateChildJobObjects((prev) => prev.concat(jobs));
      updateJobImport(true);
    }
  }, [displayPopover]);

  let totalPrice = 0;

  return (
    <Popover
      id={material.typeID}
      open={Boolean(displayPopover)}
      anchorEl={displayPopover}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      onClose={() => {
        updateDisplayPopover(null);
      }}
    >
      <Paper
        square
        sx={{ padding: "20px", maxWidth: { xs: "350px", sm: "450px" } }}
      >
        {!jobImport ? (
          <CircularProgress color="primary" />
        ) : (
          <Grid container direction="row">
            <Grid item xs={12} sx={{ marginBottom: "10px" }}>
              <Typography variant="body2" align="center">
                {material.name}
              </Typography>
            </Grid>
            {childJobObjects[jobDisplay].build.materials.map((mat) => {
              let materialPrice = evePrices.find(
                (i) => i.typeID === mat.typeID
              );
              totalPrice +=
                materialPrice[marketSelect][listingSelect] * mat.quantity;

              return (
                <Grid key={mat.typeID} container item xs={12}>
                  <Grid item xs={8}>
                    <Typography variant="body2">{mat.name}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" align="right">
                      {(
                        materialPrice[marketSelect][listingSelect] *
                        mat.quantity
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Typography>
                  </Grid>
                </Grid>
              );
            })}
            <Grid container item xs={12} sx={{ marginTop: "10px" }}>
              <Grid item xs={8}>
                <Typography variant="body2">
                  Item{" "}
                  {listingSelect.charAt(0).toUpperCase() +
                    listingSelect.slice(1)}{" "}
                  Price
                </Typography>
              </Grid>
              <Grid item xs={4} variant="body2">
                <Typography variant="body2" align="right">
                  {(
                    totalPrice /
                    childJobObjects[jobDisplay].build.products.totalQuantity
                  ).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Typography>
              </Grid>
            </Grid>
            <Grid container item xs={12} sx={{ marginTop: "10px" }}>
              <Grid item xs={8}>
                <Typography variant="body2">
                  Total Material{" "}
                  {listingSelect.charAt(0).toUpperCase() +
                    listingSelect.slice(1)}{" "}
                  Price
                </Typography>
              </Grid>
              <Grid item xs={4} variant="body2" align="right">
                <Typography variant="body2" align="right">
                  {totalPrice.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Typography>
              </Grid>
            </Grid>
            {childJobObjects.length > 1 && (
              <Grid container item xs={12} sx={{ marginTop: "10px" }}>
                <Grid item xs={1}>
                  <IconButton
                    disabled={jobDisplay === 0}
                    onClick={() => {
                      setJobDisplay((prev) => prev - 1);
                    }}
                  >
                    <ArrowBackOutlinedIcon />
                  </IconButton>
                </Grid>
                <Grid
                  container
                  item
                  xs={10}
                  justifyContent="center"
                  alignItems="center"
                >
                  <Typography variant="body2">Toggle Child Jobs</Typography>
                </Grid>
                <Grid item xs={1}>
                  <IconButton
                    disabled={jobDisplay === childJobObjects.length}
                    onClick={() => {
                      setJobDisplay((prev) => prev + 1);
                    }}
                  >
                    <ArrowForwardOutlinedIcon />
                  </IconButton>
                </Grid>
              </Grid>
            )}
            <Grid item xs={12} align="center" sx={{ marginTop: "10px" }}>
              <Button
                size="small"
                onClick={() => {
                  if (isLoggedIn && jobModified) {
                    uploadJob(activeJob);
                  }
                  closeEditJob(activeJob);
                  openEditJob(childJobObjects[jobDisplay]);
                }}
              >
                Open Child Job
              </Button>
            </Grid>
          </Grid>
        )}
      </Paper>
    </Popover>
  );
}
