import { useContext, useMemo, useState } from "react";
import {
  CircularProgress,
  Grid,
  IconButton,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import blueprintIDs from "../../../RawData/searchIndex.json";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import { BlueprintEntry } from "./classicBlueprintEntry";
import { ApiJobsContext, JobArrayContext } from "../../../Context/JobContext";
import AddIcon from "@mui/icons-material/Add";
import { ArchiveBpData } from "../blueprintArchiveData";
import { useJobBuild } from "../../../Hooks/useJobBuild";
import { useJobManagement } from "../../../Hooks/useJobManagement";
import { useFirebase } from "../../../Hooks/useFirebase";
import { EvePricesContext } from "../../../Context/EveDataContext";
import { SnackBarDataContext } from "../../../Context/LayoutContext";
import {
  UserJobSnapshotContext,
  UsersContext,
} from "../../../Context/AuthContext";
import { getAnalytics, logEvent } from "firebase/analytics";
import { trace } from "@firebase/performance";
import { performance } from "../../../firebase";
<<<<<<< HEAD
=======
import { useJobSnapshotManagement } from "../../../Hooks/JobHooks/useJobSnapshots";
>>>>>>> 30eec5e2076ea65502f8af77eb7e306834252569

export function ClassicBlueprintGroup({ bpID, blueprintResults }) {
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
<<<<<<< HEAD
  const { generatePriceRequestFromJob, newJobSnapshot } = useJobManagement();
=======
  const { generatePriceRequestFromJob } = useJobManagement();
  const { newJobSnapshot } = useJobSnapshotManagement();
>>>>>>> 30eec5e2076ea65502f8af77eb7e306834252569
  const { addNewJob, getItemPrices, uploadJob, uploadUserJobSnapshot } =
    useFirebase();
  const analytics = getAnalytics();
  const t = trace(performance, "CreateJobProcessFull");

  const parentUser = useMemo(() => users.find((i) => i.ParentUser), [users]);

  const esiJobs = apiJobs.filter(
    (i) => i.product_type_id === bpID || i.blueprint_type_id === bpID
  );

  let bpData = blueprintIDs.find((i) => i.blueprintID === bpID);
  let output = blueprintResults.blueprints.filter((bp) => bp.type_id === bpID);

  if (!bpData) {
    return null;
  }
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
                    if (!checkAllowBuild) {
                      updateLoadingBuild((prev) => !prev);
                      return;
                    }
                    let newJob = await buildJob({ itemID: bpData.itemID });
                    if (newJob === undefined) {
                      updateLoadingBuild((prev) => !prev);
                      return;
                    }

                    let promiseArray = [
                      getItemPrices(
                        generatePriceRequestFromJob(newJob),
                        parentUser
                      ),
                    ];
                    let newUserJobSnapshot = newJobSnapshot(newJob, [
                      ...userJobSnapshot,
                    ]);
                    addNewJob(newJob);
                    uploadUserJobSnapshot(newUserJobSnapshot);

                    logEvent(analytics, "New Job", {
                      loggedIn: true,
                      UID: parentUser.accountID,
                      name: newJob.name,
                      itemID: newJob.itemID,
                    });
                    let returnPromiseArray = await Promise.all(promiseArray);
                    updateUserJobSnapshot(newUserJobSnapshot);
                    updateEvePrices((prev) => {
                      const prevIds = new Set(prev.map((item) => item.typeID));
                      const uniqueNewEvePrices = returnPromiseArray[0].filter(
                        (item) => !prevIds.has(item.typeID)
                      );
                      return [...prev, ...uniqueNewEvePrices];
                    });
                    updateJobArray((prev) => [...prev, newJob]);
                    setSnackbarData((prev) => ({
                      ...prev,
                      open: true,
                      message: `${newJob.name} Added`,
                      severity: "success",
                      autoHideDuration: 3000,
                    }));

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
}
