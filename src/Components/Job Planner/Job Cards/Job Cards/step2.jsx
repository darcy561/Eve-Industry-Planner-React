import {
  Box,
  Button,
  Checkbox,
  Grid,
  IconButton,
  Paper,
  Typography,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import DeleteIcon from "@mui/icons-material/Delete";
import { jobTypes } from "../../JobPlanner";
import { useJobManagement } from "../../../../Hooks/useJobManagement";
import { useContext } from "react";
import { MultiSelectJobPlannerContext } from "../../../../Context/LayoutContext";

const useStyles = makeStyles((theme) => ({
  Image: {
    margin: "auto",
    display: "block",
  },
  Header: {
    marginBottom: "10px",
  },
  Checkbox: {
    color:
      theme.palette.type === "dark"
        ? theme.palette.primary.main
        : theme.palette.secondary.main,
  },
  DeleteIcon: {
    color: theme.palette.type === "dark"
    ? theme.palette.primary.main
    : theme.palette.secondary.main,
  }
}));

export default function Step2JobCard({
  job,
  updateJobSettingsTrigger,
}) {
  const { multiSelectJobPlanner, updateMultiSelectJobPlanner } = useContext(MultiSelectJobPlannerContext)
  const { deleteJobProcess, openEditJob } = useJobManagement();
  const classes = useStyles();
  let totalComplete = 0;
  if (!job.isSnapshot) { 
  job.build.materials.forEach((material) => {
    if (material.quantityPurchased >= material.quantity) {
      totalComplete++;
    }
  });
}

  return (
    <Grid key={job.jobID} item xs={12} sm={6} md={4} lg={3}>
      <Paper
        className={classes.Card}
        elevation={3}
        square={true}
        sx={{ padding: "10px", height: "100%" }}
      >
        <Grid container item xs={12}>
          <Grid container item xs={12}>
            <Grid item xs={1}>
            <Checkbox
                className={classes.Checkbox}
                checked={multiSelectJobPlanner.some((i) => i.jobID === job.jobID)}
                onChange={(event) => {
                  if (event.target.checked) {
                    if (multiSelectJobPlanner.filter((i) => i.jobID === job.jobID)) {
                      updateMultiSelectJobPlanner([...multiSelectJobPlanner, job]);
                    }
                  } else {
                    if (multiSelectJobPlanner.filter((i) => i.jobID !== job.jobID)) {
                      let newArray = multiSelectJobPlanner.filter(
                        (i) => i.jobID !== job.jobID
                      );
                      updateMultiSelectJobPlanner(newArray);
                    }
                  }
                }}
              ></Checkbox>
            </Grid>
            <Grid item xs={10} />
            <Grid
              item
              xs={1}
              sx={{ paddingRight: { xs: "0px", sm: "10px", md: "0px" } }}
            >
              <IconButton size="small"className={classes.DeleteIcon} onClick={() => deleteJobProcess(job)}>
                <DeleteIcon />
              </IconButton>
            </Grid>
          </Grid>
          <Grid className={classes.Header} item xs={12}>
            <Typography
              variant="h6"
              color="secondary"
              align="center"
              sx={{ minHeight: "4rem" }}
            >
              {job.name}
            </Typography>
          </Grid>
          <Grid container item xs={12}>
            <Grid item sm={3}>
              <picture className={classes.Image}>
                <img
                  src={`https://images.evetech.net/types/${job.itemID}/icon?size=64`}
                  alt=""
                  className={classes.Image}
                />
              </picture>
            </Grid>
            <Grid container item xs={9}>
              <Grid container item xs={12}>
                <Grid item xs={8}>
                  <Typography
                    variant="body2"
                    sx={{ paddingLeft: { xs: "20px", sm: "0px" } }}
                  >
                    Number of Materials
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography
                    variant="body1"
                    align="right"
                    sx={{ paddingRight: { sm: "20px" } }}
                  >
                    {job.isSnapshot ? job.totalMaterials.toLocaleString(): job.build.materials.length.toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
              <Grid container item xs={12}>
                <Grid item xs={10}>
                  <Typography
                    variant="body2"
                    sx={{ paddingLeft: { xs: "20px", sm: "0px" } }}
                  >
                    Completed Purchases
                  </Typography>
                </Grid>
                <Grid item xs={2}>
                  <Typography
                    variant="body1"
                    align="right"
                    sx={{ paddingRight: { sm: "20px" } }}
                  >
                    {job.isSnapshot ? job.totalComplete.toLocaleString(): totalComplete }
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12} align="center" sx={{ marginTop: "20px" }}>
            <Button
              size="small"
              variant="outlined"
              color="primary"
              onClick={() => {
                openEditJob(job)
                updateJobSettingsTrigger((prev) => !prev)
              }}
            >
              Edit
            </Button>
          </Grid>
          <Grid
            item
            xs={12}
            sx={{ backgroundColor: job.jobType === jobTypes.manufacturing ? "manufacturing.main" : "reaction.main", marginTop: "10px" }}
          >
            <Box>
              <Typography align="center" variant="body2" color="black">
                {job.jobType === jobTypes.manufacturing ? <b>Manufacturing Job</b> : <b>Reaction Job</b>}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Grid>
  );
}
