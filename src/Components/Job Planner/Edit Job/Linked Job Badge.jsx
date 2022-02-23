import {
  Avatar,
  Chip,
  Grid,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { useContext, useState } from "react";
import { ActiveJobContext, JobArrayContext } from "../../../Context/JobContext";
import AddIcon from "@mui/icons-material/Add";
import ClearIcon from "@mui/icons-material/Clear";
import { ParentJobDialog } from "./parentJobDialog";
import { SnackBarDataContext } from "../../../Context/LayoutContext";
import { useFirebase } from "../../../Hooks/useFirebase";
import { IsLoggedInContext } from "../../../Context/AuthContext";
import { useJobManagement } from "../../../Hooks/useJobManagement";

export function LinkedJobBadge({jobModified, setJobModified}) {
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const { jobArray } = useContext(JobArrayContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const [dialogTrigger, updateDialogTrigger] = useState(false);
  const { downloadCharacterJobs, updateMainUserDoc, uploadJob } = useFirebase()
  const { closeEditJob, openEditJob } = useJobManagement();


  let parentJobs = [];
  activeJob.parentJob.forEach((job) => {
    parentJobs.push(jobArray.find((i) => i.jobID === job));
  });

  return (
    <>
      <ParentJobDialog
        dialogTrigger={dialogTrigger}
        updateDialogTrigger={updateDialogTrigger}
        setJobModified={setJobModified}
      />
      <Stack
        direction="row"
        sx={{ marginBottom: { xs: "10px", sm: "0px" }, position: "relative" }}
      >
        <Grid container>
          <Grid item xs={12} align="center" sx={{marginBottom:{xs:"10px", sm:"0px"}}}>
            <Typography variant="h6" color="primary">
              Parent Jobs
            </Typography>
          </Grid>
          <IconButton
            size="small"
            color="primary"
            sx={{ position: "absolute", top: "0px", right: "40px" }}
            onClick={() => {
              updateDialogTrigger(true);
            }}
          >
            <AddIcon />
          </IconButton>

          {parentJobs.length > 0
            ? parentJobs.map((job) => {
                return (
                  <Grid
                    key={job.jobID}
                    item
                    xs="auto"
                    align="right"
                    sx={{ padding: "5px 5px" }}
                  >
                    <Chip
                      key={job.jobID}
                      label={job.name}
                      size="large"
                      deleteIcon={<ClearIcon />}
                      avatar={
                        <Avatar
                          src={`https://image.eveonline.com/Type/${job.itemID}_32.png`}
                        />
                      }
                      clickable
                      onClick={() => {
                        if (isLoggedIn && jobModified) {
                          uploadJob(activeJob);
                          updateMainUserDoc();
                        }
                        closeEditJob(activeJob)
                        openEditJob(job);
                      }}
                      variant="outlined"
                      sx={{
                        "& .MuiChip-deleteIcon": {
                          color: "error.main",
                        },
                        boxShadow: 3,
                      }}
                      onDelete={async() => {
                        if (job.isSnapshot) {
                          job = await downloadCharacterJobs(job);
                          job.isSnapshot = false;
                        }
                        let newParentMaterials = [...job.build.materials]
                        const material = newParentMaterials.find((i) => i.typeID === activeJob.itemID)
                        const index = material.childJob.findIndex((i) => i === activeJob.jobID)
                        material.childJob.splice(index, 1)
                        
                        let newParentJobs = [...activeJob.parentJob]
                        let parentIndex = newParentJobs.findIndex((i) => i === job.jobID)
                        if (parentIndex !== -1) {
                          newParentJobs.splice(parentIndex, 1)  
                        }

                        updateActiveJob((prev) => ({
                          ...prev,
                            parentJob: newParentJobs
                        }))
                        
                        setSnackbarData((prev) => ({
                          ...prev,
                          open: true,
                          message: `${job.name} Unlinked`,
                          severity: "success",
                          autoHideDuration: 1000,
                        }));
                        setJobModified(true);
                        uploadJob(job);
                      }}
                    />
                  </Grid>
                );
              })
            : null}
        </Grid>
      </Stack>
    </>
  );
}
