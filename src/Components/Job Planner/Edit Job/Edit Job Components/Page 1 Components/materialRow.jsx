import { useContext, useMemo, useState } from "react";
import {
  ActiveJobContext,
  JobArrayContext,
} from "../../../../../Context/JobContext";
import { useJobManagement } from "../../../../../Hooks/useJobManagement";
import {
  CircularProgress,
  Grid,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import { MdOutlineAddCircle, MdRemoveCircle } from "react-icons/md";
import { jobTypes } from "../../../../../Context/defaultValues";
import { useJobBuild } from "../../../../../Hooks/useJobBuild";
import { useFirebase } from "../../../../../Hooks/useFirebase";
import { getAnalytics, logEvent } from "firebase/analytics";
import {
  IsLoggedInContext,
  UsersContext,
} from "../../../../../Context/AuthContext";
import { SnackBarDataContext } from "../../../../../Context/LayoutContext";
import { EvePricesContext } from "../../../../../Context/EveDataContext";
import DoneIcon from "@mui/icons-material/Done";
import { trace } from "@firebase/performance";
import { performance } from "../../../../../firebase";

export function MaterialRow({ material }) {
  const { activeJob } = useContext(ActiveJobContext);
  const { updateJobArray } = useContext(JobArrayContext);
  const { users } = useContext(UsersContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { updateEvePrices } = useContext(EvePricesContext);
  const { addNewJob, getItemPrices, updateMainUserDoc, uploadJob } = useFirebase();
  const { checkAllowBuild, buildJob } = useJobBuild();
  const { newJobSnapshot, updateJobSnapshot } = useJobManagement();
  const [addJob, updateAddJob] = useState(false);
  const analytics = getAnalytics();
  const parentUser = useMemo(() => {
    return users.find((i) => i.ParentUser);
  }, [users]);
  const t = trace(performance, "CreateJobProcessFull");

  async function handleAdd() {
    if (
      material.jobType === jobTypes.manufacturing ||
      material.jobType === jobTypes.reaction
    ) {
      t.start();
      updateAddJob(true);
      if (checkAllowBuild) {
        let newJob = await buildJob(material.typeID, material.quantity, [
          activeJob,
        ]);
        if (newJob !== undefined) {
          let priceIDRequest = new Set();
          let promiseArray = [];
          priceIDRequest.add(newJob.itemID);
          newJob.build.materials.forEach((mat) => {
            priceIDRequest.add(mat.typeID);
          });
          let itemPrices = getItemPrices([...priceIDRequest]);
          promiseArray.push(itemPrices);
          await newJobSnapshot(newJob);

          if (isLoggedIn) {
            await updateMainUserDoc();
            await addNewJob(newJob);
          }

          logEvent(analytics, "New Job", {
            loggedIn: isLoggedIn,
            UID: parentUser.accountID,
            name: newJob.name,
            itemID: newJob.itemID,
          });
          let returnPromiseArray = await Promise.all(promiseArray);
          updateEvePrices((prev) => prev.concat(returnPromiseArray[0]));
          updateJobArray((prev) => [...prev, newJob]);
          setSnackbarData((prev) => ({
            ...prev,
            open: true,
            message: `${newJob.name} Added`,
            severity: "success",
            autoHideDuration: 3000,
          }));
        }
        material.childJob.push(newJob.jobID);
        updateJobSnapshot(activeJob);
        await uploadJob(activeJob)
      }
      updateAddJob(false);
      t.stop();
    }
  }

  return (
    <Grid item container direction="row">
      <Grid item xs={2} sm={1} align="center">
        {material.childJob.length === 0 ? (
          addJob ? (
            <CircularProgress size={14} color="primary" />
          ) : (
            <Tooltip
              title={
                material.jobType === jobTypes.manufacturing
                  ? "Manufacturing Job, click to create a new child job."
                  : material.jobType === jobTypes.reaction
                  ? "Reaction Job, click to create a new child job"
                  : material.jobType === jobTypes.pi
                  ? "Planetary Interaction"
                  : "Base Material"
              }
              placement="left-start"
              arrow
            >
              <IconButton
                onClick={handleAdd}
                size="small"
                disableRipple={
                  material.jobType === jobTypes.manufacturing ||
                  material.jobType === jobTypes.reaction
                    ? false
                    : true
                }
                sx={{
                  color:
                    material.jobType === jobTypes.manufacturing
                      ? "manufacturing.main"
                      : material.jobType === jobTypes.reaction
                      ? "reaction.main"
                      : material.jobType === jobTypes.pi
                      ? "pi.main"
                      : "baseMat.main",
                }}
              >
                {material.jobType === jobTypes.manufacturing ||
                material.jobType === jobTypes.reaction ? (
                  <MdOutlineAddCircle />
                ) : (
                  <MdRemoveCircle />
                )}
              </IconButton>
            </Tooltip>
          )
        ) : (
          <Tooltip
            title={
              material.jobType === jobTypes.manufacturing
                ? "Manufacturing Child Job Linked."
                : "Reaction Child Job Linked."
            }
            placement="left-start"
            arrow
          >
            <IconButton
              size="small"
              disableRipple={true}
              sx={{
                color:
                  material.jobType === jobTypes.manufacturing
                    ? "manufacturing.main"
                    : material.jobType === jobTypes.reaction
                    ? "reaction.main"
                    : material.jobType === jobTypes.pi
                    ? "pi.main"
                    : "baseMat.main",
              }}
            >
              <DoneIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Grid>
      <Grid item xs={7} sm={7}>
        <Typography sx={{ typography: { xs: "body2", sm: "body1" } }}>
          {material.name}
        </Typography>
      </Grid>
      <Grid item xs={3} sm={4} align="right">
        <Typography sx={{ typography: { xs: "body2", sm: "body1" } }}>
          {material.quantity.toLocaleString()}
        </Typography>
      </Grid>
    </Grid>
  );
}
