import { useContext } from "react";
import { ActiveJobContext } from "../../../Context/JobContext";
import {
  Button,
  Checkbox,
  Grid,
  IconButton,
  Paper,
  Typography,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import { useFirebase } from "../../../Hooks/useFirebase";
import {
  LoadingTextContext,
  PageLoadContext,
} from "../../../Context/LayoutContext";
import DeleteIcon from "@mui/icons-material/Delete";
import { useJobManagement } from "../../../Hooks/useJobManagement";

const useStyles = makeStyles((theme) => ({
  Image: {
    margin: "auto",
    display: "block",
  },
  Header: {
    marginBottom: "10px",
  },
  Checkbox: {
    color: theme.palette.type === "dark" ? (theme.palette.primary.main) : (theme.palette.secondary.main)
  }
}));


export function JobCard({
  job,
  updateJobSettingsTrigger,
  multiSelect,
  updateMultiSelect,
}) {
  const { updateActiveJob } = useContext(ActiveJobContext);
  const { downloadCharacterJobs } = useFirebase();
  const { updatePageLoad } = useContext(PageLoadContext);
  const { updateLoadingText } = useContext(LoadingTextContext);
  const { deleteJobProcess } = useJobManagement();
  const classes = useStyles();

  async function EditJobProcess(job) {
    updateLoadingText((prevObj) => ({
      ...prevObj,
      jobData: true,
    }));
    updatePageLoad(true);
    if (job.isSnapshot) {
      const jobEdit = await downloadCharacterJobs(job);
      job = jobEdit;
      job.isSnapshot = false;
    }
    updateActiveJob(job);
    updatePageLoad(false);
    updateLoadingText((prevObj) => ({
      ...prevObj,
      jobDataComp: true,
    }));
    updateJobSettingsTrigger((prev) => !prev);
    updateLoadingText((prevObj) => ({
      ...prevObj,
      jobData: false,
      jobDataComp: false,
    }));
    // This function sets up the correct job to be changed and displays the popup window.
  }

  return (
      <Grid key={job.jobID} item xs={12} sm={6} md={4} lg={3}>
        <Paper className={classes.Card} elevation={3} square={true} sx={{padding:"10px"}}>
          <Grid container item xs={12}>
            <Grid container item xs={12}>
            <Grid item xs={1}>
              <Checkbox
                className={classes.Checkbox}
                checked={multiSelect.some((i) => i.jobID === job.jobID )}
                  onChange={(event) => {
                    if (event.target.checked) {
                      if (multiSelect.filter((i) => i.jobID === job.jobID)) {
                        updateMultiSelect([...multiSelect, job]);
                      }
                    } else {
                      if (multiSelect.filter((i) => i.jobID !== job.jobID)) {
                        let newArray = multiSelect.filter(
                          (i) => i.jobID !== job.jobID
                        );
                        updateMultiSelect(newArray);
                      }
                    }
                  }}
                ></Checkbox>
              </Grid>
              <Grid item xs={10} />
              <Grid item xs={1}>
                <IconButton size="small" onClick={()=> deleteJobProcess(job)}>
                  <DeleteIcon />
                </IconButton>
              </Grid>
            </Grid>
            <Grid className={classes.Header} item xs={12}>
              <Typography variant="h6" color="secondary" align="center">
                {job.name}
              </Typography>
            </Grid>
            <Grid container item xs={12}>
              <Grid item sm={3}>
                <picture className={classes.Image}>
                  <img
                    src={`https://image.eveonline.com/Type/${job.itemID}_64.png`}
                    alt=""
                    className={classes.Image}
                  />
                </picture>
              </Grid>
              <Grid container item xs={9}>
                <Grid container item xs={12}>
                  <Grid item xs={8}>
                    <Typography
                      variant="body1"
                      sx={{ paddingLeft: { xs: "20px", sm: "0px" } }}
                    >
                      Runs
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography
                      variant="body1"
                      align="right"
                      sx={{ paddingRight: { sm: "20px" } }}
                    >
                      {job.runCount.toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>
                <Grid container item xs={12}>
                  <Grid item xs={10}>
                    <Typography
                      variant="body1"
                      sx={{ paddingLeft: { xs: "20px", sm: "0px" } }}
                    >
                      Job Slots
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography
                      variant="body1"
                      align="right"
                      sx={{ paddingRight: { sm: "20px" } }}
                    >
                      {job.jobCount.toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} align="right" sx={{ marginTop: "20px" }}>
              <Button
                size="small"
                variant="outlined"
                color="primary"
                onClick={() => EditJobProcess(job)}
              >
                Open
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
  );
}
