import { useContext, useMemo, useState } from "react";
import {
  CircularProgress,
  Grid,
  IconButton,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import blueprintIDs from "../../RawData/searchIndex.json";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import { BlueprintEntry } from "./BlueprintEntry";
import { ApiJobsContext, JobArrayContext } from "../../Context/JobContext";
import AddIcon from "@mui/icons-material/Add";
import { ArchiveBpData } from "./blueprintArchiveData";
import { useJobBuild } from "../../Hooks/useJobBuild";
import { useJobManagement } from "../../Hooks/useJobManagement";
import { useFirebase } from "../../Hooks/useFirebase";
import { EvePricesContext } from "../../Context/EveDataContext";
import { SnackBarDataContext } from "../../Context/LayoutContext";
import {
  UserJobSnapshotContext,
  UsersContext,
} from "../../Context/AuthContext";
import { getAnalytics, logEvent } from "firebase/analytics";
import { trace } from "@firebase/performance";
import { performance } from "../../firebase";

export function BlueprintGroup({ bpID, blueprintResults }) {
  const { users } = useContext(UsersContext);
  const { apiJobs } = useContext(ApiJobsContext);
  const { updateJobArray } = useContext(JobArrayContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { updateEvePrices } = useContext(EvePricesContext);
  const { userJobSnapshot, updateUserJobSnapshot } = useContext(
    UserJobSnapshotContext
  );
  const [archiveOpen, updateArchiveOpen] = useState(false);
  const [loadingBuild, updateLoadingBuild] = useState(false);
  const { buildJob, checkAllowBuild } = useJobBuild();
  const { newJobSnapshot } = useJobManagement();
  const { addNewJob, getItemPrices, updateMainUserDoc, uploadJob } =
    useFirebase();
  const analytics = getAnalytics();
  const t = trace(performance, "CreateJobProcessFull");

  const parentUser = useMemo(() => {
    return users.find((i) => i.ParentUser);
  }, [users]);

  const esiJobs = apiJobs.filter(
    (i) => i.product_type_id === bpID || i.blueprint_type_id === bpID
  );

  let bpData = blueprintIDs.find((i) => i.blueprintID === bpID);
  let output = blueprintResults.blueprints.filter((bp) => bp.type_id === bpID);

  if (bpData !== undefined) {
    return (
      <Grid key={bpID} container item xs={12} sm={6}>
        <Paper
          square={true}
          elevation={2}
          sx={{ width: "100%", padding: "20px" }}
        >
          <Grid
            container
            item
            xs={12}
            sx={{
              paddingBottom: "10px",
            }}
          >
            <Grid item xs={9} sx={{ marginBottom: "20px" }}>
              <Typography
                color="primary"
                sx={{ typography: { xs: "h6", sm: "h5" } }}
              >
                {bpData.name}
              </Typography>
            </Grid>
            <Grid item xs={3} align="right">
              {!loadingBuild ? (
                <Tooltip title="Create Job On Planner" arrow placement="bottom">
                  <IconButton
                    color="primary"
                    size="small"
                    onClick={async () => {
                      t.start();
                      updateLoadingBuild((prev) => !prev);
                      if (checkAllowBuild) {
                        let newJob = await buildJob({ itemID: bpData.itemID });
                        if (newJob === undefined) {
                          updateLoadingBuild((prev) => !prev);
                          return;
                        }
                        let priceIDRequest = new Set();
                        let promiseArray = [];
                        priceIDRequest.add(newJob.itemID);
                        newJob.build.materials.forEach((mat) => {
                          priceIDRequest.add(mat.typeID);
                        });
                        let itemPrices = getItemPrices(
                          [...priceIDRequest],
                          parentUser
                        );
                        promiseArray.push(itemPrices);
                        let newUserJobSnapshot = newJobSnapshot(newJob, [
                          ...userJobSnapshot,
                        ]);
                        await addNewJob(newJob);
                        await updateUserJobSnapshot(newUserJobSnapshot);

                        logEvent(analytics, "New Job", {
                          loggedIn: true,
                          UID: parentUser.accountID,
                          name: newJob.name,
                          itemID: newJob.itemID,
                        });
                        let returnPromiseArray = await Promise.all(
                          promiseArray
                        );
                        updateUserJobSnapshot(newUserJobSnapshot);
                        updateEvePrices((prev) =>
                          prev.concat(returnPromiseArray[0])
                        );
                        updateJobArray((prev) => [...prev, newJob]);
                        setSnackbarData((prev) => ({
                          ...prev,
                          open: true,
                          message: `${newJob.name} Added`,
                          severity: "success",
                          autoHideDuration: 3000,
                        }));
                        await uploadJob(newJob);
                      }
                      updateLoadingBuild((prev) => !prev);
                      t.stop();
                    }}
                  >
                    <AddIcon />
                  </IconButton>
                </Tooltip>
              ) : (
                <CircularProgress color="primary" size={14} />
              )}
              <Tooltip title="Archived Job Data" arrow placement="bottom">
                <IconButton
                  color="primary"
                  size="small"
                  onClick={() => {
                    updateArchiveOpen((prev) => !prev);
                  }}
                >
                  <AssessmentOutlinedIcon />
                </IconButton>
              </Tooltip>
              <ArchiveBpData
                archiveOpen={archiveOpen}
                updateArchiveOpen={updateArchiveOpen}
                bpData={bpData}
              />
            </Grid>

            {output.length > 0 ? (
              output.map((blueprint) => {
                return (
                  <BlueprintEntry
                    key={blueprint.item_id}
                    blueprint={blueprint}
                    esiJobs={esiJobs}
                    bpData={bpData}
                  />
                );
              })
            ) : (
              <Grid item xs={12}>
                <Typography
                  align="center"
                  sx={{ typography: { xs: "caption", sm: "body2" } }}
                >
                  {" "}
                  No Blueprints Owned
                </Typography>
              </Grid>
            )}
          </Grid>
        </Paper>
      </Grid>
    );
  } else return null;
}
