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
import { CompactBlueprintEntry } from "../Compact/compactBlueprintEntry";
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
import { useJobSnapshotManagement } from "../../../Hooks/JobHooks/useJobSnapshots";

export function CompactBlueprintGroup({ bpID, blueprintResults }) {
  const { users } = useContext(UsersContext);
  const { updateJobArray } = useContext(JobArrayContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { updateEvePrices } = useContext(EvePricesContext);
  const { userJobSnapshot, updateUserJobSnapshot } = useContext(
    UserJobSnapshotContext
  );
  const [archiveOpen, updateArchiveOpen] = useState(false);
  const [loadingBuild, updateLoadingBuild] = useState(false);
  const { buildJob, checkAllowBuild } = useJobBuild();
  const { generatePriceRequestFromJob } = useJobManagement();
  const { newJobSnapshot } = useJobSnapshotManagement();
  const { addNewJob, getItemPrices, uploadUserJobSnapshot } = useFirebase();
  const analytics = getAnalytics();
  const t = trace(performance, "CreateJobProcessFull");

  const parentUser = useMemo(() => users.find((i) => i.ParentUser), [users]);

  let bpData = blueprintIDs.find((i) => i.blueprintID === bpID);
  let filteredResults = blueprintResults.blueprints.filter(
    (bp) => bp.type_id === bpID
  );

  function sortObjectsIntoArrays(objects) {
    if (objects.length === 0) {
      return [];
    }
    const result = {};

    objects.forEach((obj) => {
      let key = `${obj["material_efficiency"]}-${obj["time_efficiency"]}-${obj["quantity"]}-${obj["runs"]}-${obj["isCorp"]}`;

      if (obj.characterHash) {
        key += `-${obj.characterHash}`;
      } else if (obj.corporation_id) {
        key += `-${obj.corporation_id}`;
      }

      if (!result[key]) {
        result[key] = [];
      }

      result[key].push(obj);
    });

    return Object.values(result);
  }

  const sortedResults = sortObjectsIntoArrays(filteredResults);

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
                    if (!newJob) {
                      updateLoadingBuild((prev) => !prev);
                      return;
                    }

                    const itemPricePromise = [
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
                    const itemPriceResult = await Promise.all(itemPricePromise);
                    updateUserJobSnapshot(newUserJobSnapshot);
                    updateEvePrices((prev) => ({
                      ...prev,
                      ...itemPriceResult,
                    }));
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
          <Grid container item xs={12} spacing={1}>
            {sortedResults.length > 0 ? (
              sortedResults.map((blueprintGroup) => {
                return (
                  <CompactBlueprintEntry
                    key={blueprintGroup[0].item_id}
                    blueprintGroup={blueprintGroup}
                    bpData={bpData}
                  />
                );
              })
            ) : (
              <Typography
                align="center"
                sx={{ typography: { xs: "caption", sm: "body2" } }}
              >
                {" "}
                No Blueprints Owned
              </Typography>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Grid>
  );
}
