import { useContext } from "react";
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
    color:
      theme.palette.type === "dark"
        ? theme.palette.primary.main
        : theme.palette.secondary.main,
  },
}));

export default function Step1JobCard({ job, updateJobSettingsTrigger }) {
  const { multiSelectJobPlanner, updateMultiSelectJobPlanner } = useContext(
    MultiSelectJobPlannerContext
  );
  const { deleteJobProcess, openEditJob } = useJobManagement();
  const classes = useStyles();

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
                checked={multiSelectJobPlanner.some(
                  (i) => i.jobID === job.jobID
                )}
                onChange={(event) => {
                  if (event.target.checked) {
                    if (
                      multiSelectJobPlanner.filter((i) => i.jobID === job.jobID)
                    ) {
                      updateMultiSelectJobPlanner([
                        ...multiSelectJobPlanner,
                        job,
                      ]);
                    }
                  } else {
                    if (
                      multiSelectJobPlanner.filter((i) => i.jobID !== job.jobID)
                    ) {
                      let newArray = multiSelectJobPlanner.filter(
                        (i) => i.jobID !== job.jobID
                      );
                      updateMultiSelectJobPlanner(newArray);
                    }
                  }
                }}
                sx={{height:{xs: "20px", sm:"15px"}, width:{xs:"5px", sm:"15px"}}}
              ></Checkbox>
            </Grid>
            <Grid item xs={10} />
            <Grid
              item
              xs={1}
              sx={{ paddingRight: { xs: "0px", sm: "10px", md: "0px" } }}
            >
              <IconButton
                size="small"
                className={classes.DeleteIcon}
                onClick={() => deleteJobProcess(job)}
              >
                <DeleteIcon />
              </IconButton>
            </Grid>
          </Grid>
          <Grid className={classes.Header} item xs={12}>
            <Typography
              color="secondary"
              align="center"
              sx={{ minHeight:{xs:"2rem", sm:"4rem"}, typography: { xs: "body1", sm: "h6" } }}
            >
              {job.name}
            </Typography>
          </Grid>
          <Grid container item xs={12}>
            <Grid item xs={1} sm={3}>
              <picture className={classes.Image}>
                <source
                  media="(max-width:700px)"
                  srcSet={`https://images.evetech.net/types/${job.itemID}/icon?size=32`}
                />
                <img
                  src={`https://images.evetech.net/types/${job.itemID}/icon?size=64`}
                  alt=""
                />
              </picture>
            </Grid>
            <Grid container item xs={9}>
              <Grid container item xs={12}>
                <Grid item xs={8}>
                  <Typography
                    sx={{
                      paddingLeft: { xs: "20px", sm: "0px" },
                      typography: { xs: "body2", sm: "body1" },
                    }}
                  >
                    Runs
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography
                    align="right"
                    sx={{
                      paddingRight: { sm: "20px" },
                      typography: { xs: "body2", sm: "body1" },
                    }}
                  >
                    {job.runCount.toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
              <Grid container item xs={12}>
                <Grid item xs={10}>
                  <Typography
                    sx={{
                      paddingLeft: { xs: "20px", sm: "0px" },
                      typography: { xs: "body2", sm: "body1" },
                    }}
                  >
                    Job Slots
                  </Typography>
                </Grid>
                <Grid item xs={2}>
                  <Typography
                    align="right"
                    sx={{
                      paddingRight: { sm: "20px" },
                      typography: { xs: "body2", sm: "body1" },
                    }}
                  >
                    {job.jobCount.toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          <Grid
            item
            xs={12}
            align="center"
            sx={{ marginTop: { xs: "5px", sm: "5px" } }}
          >
            <Button
              // size="small"
              variant="outlined"
              color="primary"
              onClick={() => {
                openEditJob(job);
                updateJobSettingsTrigger((prev) => !prev);
              }}
              sx={{ height: "25px", width: "100px" }}
            >
              Edit
            </Button>
          </Grid>
          <Grid
            item
            xs={12}
            sx={{
              backgroundColor:
                job.jobType === jobTypes.manufacturing
                  ? "manufacturing.main"
                  : "reaction.main",
              marginTop: "10px",
            }}
          >
            <Box>
              <Typography align="center" variant="body2" color="black">
                {job.jobType === jobTypes.manufacturing ? (
                  <b>Manufacturing Job</b>
                ) : (
                  <b>Reaction Job</b>
                )}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Grid>
  );
}
