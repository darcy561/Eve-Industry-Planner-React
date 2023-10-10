import { useContext, useEffect, useState } from "react";
import {
  Autocomplete,
  CircularProgress,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
  Paper,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import DoneIcon from "@mui/icons-material/Done";
import { ActiveJobContext, JobArrayContext } from "../../../Context/JobContext";
import { OutputJobsPanel } from "./OutputJobs";
import { GroupAccordion } from "./groupAccordion";
import { UserJobSnapshotContext } from "../../../Context/AuthContext";
import { GroupOptionsBar } from "./groupOptions";
import { useJobManagement } from "../../../Hooks/useJobManagement";
import itemList from "../../../RawData/searchIndex.json";
import { useCloseGroup } from "../../../Hooks/GroupHooks/useCloseGroup";
import { LoadingPage } from "../../loadingPage";
import { ImportItemFitDialogue } from "./Dialogues/importFit/importFittingDialgue";

export default function GroupPage({
  shoppingListTrigger,
  updateShoppingListTrigger,
  shoppingListData,
  updateShoppingListData,
}) {
  const { activeGroup, updateActiveGroup } = useContext(ActiveJobContext);
  const { jobArray } = useContext(JobArrayContext);
  const { userJobSnapshot } = useContext(UserJobSnapshotContext);
  const [groupJobs, updateGroupJobs] = useState([]);
  const [groupPageRefresh, updateGroupPageRefresh] = useState(false);
  const [editGroupNameTrigger, updateEditGroupNameTrigger] = useState(false);
  const [tempName, updateTempName] = useState("");
  const [showProcessing, updateShowProcessing] = useState(false);
  const [importFitDialogueTrigger, updateImportFitDialogueTrigger] =
    useState(false);
  const { closeGroup } = useCloseGroup();
  const { newJobProcess } = useJobManagement();

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    if (activeGroup === null) return;
    let returnArray = [];
    updateGroupPageRefresh((prev) => !prev);
    for (let jobID of activeGroup.includedJobIDs) {
      let job = jobArray.find((i) => i?.jobID === jobID);
      if (job === undefined) {
        continue;
      }
      returnArray.push(job);
      returnArray.sort((a, b) => {
        if (a.name < b.name) {
          return -1;
        }
        if (a.name > b.name) {
          return 1;
        }
        return 0;
      });
    }
    updateGroupJobs(returnArray);
    updateGroupPageRefresh((prev) => !prev);
  }, [activeGroup, jobArray, userJobSnapshot]);

  const handleNameChange = (event) => {
    event.preventDefault();
    updateActiveGroup((prev) => ({
      ...prev,
      groupName: tempName,
    }));
    updateEditGroupNameTrigger((prev) => !prev);
  };

  if (activeGroup === null) return <LoadingPage />;

  return (
    <Paper
      elevation={3}
      sx={{
        padding: "10px",
        marginTop: "20px",
        marginBottom: "20px",
        width: "100%",
      }}
      square
    >
      <ImportItemFitDialogue
        importFitDialogueTrigger={importFitDialogueTrigger}
        updateImportFitDialogueTrigger={updateImportFitDialogueTrigger}
      />
      <Grid container>
        <Grid item xs={7} md={9} lg={10} />
        <Grid item xs={5} md={3} lg={2} align="right">
          {showProcessing && (
            <CircularProgress color="primary" size="26px" edge="false" />
          )}
          <Tooltip arrow title="Edit Group Name" placement="bottom">
            <IconButton
              color="primary"
              onClick={() => {
                updateEditGroupNameTrigger((prev) => !prev);
              }}
              sx={{ marginLeft: "10px" }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip
            arrow
            title="Saves all changes and returns to the job planner page."
            placement="bottom"
          >
            <IconButton
              color="error"
              onClick={async () => {
                closeGroup(groupJobs);
              }}
              size="medium"
              sx={{ marginRight: { sm: "10px" } }}
            >
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Grid>
        <Grid container item xs={12} sx={{ marginBottom: "50px" }}>
          {editGroupNameTrigger ? (
            <Grid container item xs={12}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  defaultValue={activeGroup.groupName}
                  size="small"
                  variant="standard"
                  sx={{
                    "& .MuiFormHelperText-root": {
                      color: (theme) => theme.palette.secondary.main,
                    },
                    "& input::-webkit-clear-button, & input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
                      {
                        display: "none",
                      },
                  }}
                  helperText="Group Name"
                  type="text"
                  onChange={(e) => {
                    updateTempName(e.target.value);
                  }}
                />
              </Grid>
              <Grid item xs={1}>
                <IconButton color="success" onClick={handleNameChange}>
                  <DoneIcon />
                </IconButton>
              </Grid>
            </Grid>
          ) : (
            <Grid item xs={12}>
              <Typography variant="h3" align="left" color="primary">
                {activeGroup.groupName}
              </Typography>
            </Grid>
          )}
        </Grid>
        <Grid container item xs={12} spacing={2}>
          <Grid item xs={12} sm={8} md={6}>
            <Autocomplete
              disableClearable
              fullWidth
              id="recipeSearch"
              clearOnBlur
              variant="standard"
              size="small"
              options={itemList}
              getOptionLabel={(option) => option.name}
              onChange={async (event, value) => {
                updateShowProcessing((prev) => !prev);
                await newJobProcess({
                  itemID: value.itemID,
                  groupID: activeGroup.groupID,
                });
                updateShowProcessing((prev) => !prev);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  label="Item Search"
                  margin="none"
                  variant="standard"
                  style={{ borderRadius: "5px" }}
                  InputProps={{ ...params.InputProps, type: "search" }}
                />
              )}
            />
          </Grid>
          <Grid
            item
            xs={12}
            sm={4}
            md={6}
            align="right"
            sx={{ paddingRight: "20px" }}
          >
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={activeGroup.showComplete}
                    onChange={() => {
                      updateActiveGroup((prev) => ({
                        ...prev,
                        showComplete: !prev.showComplete,
                      }));
                    }}
                  />
                }
                label="Show Complete Jobs"
                labelPlacement="start"
              />
            </FormGroup>
          </Grid>
          <Grid item xs={12}>
            <GroupOptionsBar
              groupJobs={groupJobs}
              updateShoppingListTrigger={updateShoppingListTrigger}
              updateShoppingListData={updateShoppingListData}
              updateShowProcessing={updateShowProcessing}
              updateImportFitDialogueTrigger={updateImportFitDialogueTrigger}
            />
          </Grid>
          <Grid item xs={12}>
            <OutputJobsPanel
              groupJobs={groupJobs}
              groupPageRefresh={groupPageRefresh}
            />
          </Grid>
          <Grid item xs={12}>
            <GroupAccordion
              groupJobs={groupJobs}
              groupPageRefresh={groupPageRefresh}
            />
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
}
