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
import SaveIcon from '@mui/icons-material/Save';
import { ActiveJobContext, JobArrayContext } from "../../../Context/JobContext";
import { OutputJobsPanel } from "./OutputJobs";
import { GroupAccordion } from "./groupAccordion";
import { GroupOptionsBar } from "./groupOptions";
import { useJobManagement } from "../../../Hooks/useJobManagement";
import itemList from "../../../RawData/searchIndex.json";
import { useCloseGroup } from "../../../Hooks/GroupHooks/useCloseGroup";
import { LoadingPage } from "../../loadingPage";
import { ImportItemFitDialogue } from "./Dialogues/importFit/importFittingDialgue";
import { ShoppingListDialog } from "../Dialogues/ShoppingList/ShoppingList";

export default function GroupPage() {
  const { activeGroup } = useContext(ActiveJobContext);
  const { jobArray, groupArray, updateGroupArray  } = useContext(JobArrayContext);
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
    if (!activeGroup) return;
    updateGroupPageRefresh((prev) => !prev);

    const selectedGroup = groupArray.find((i) => i.groupID === activeGroup);

    const includedJobIDSet = new Set(selectedGroup.includedJobIDs);

    const groupJobs = jobArray.filter((i) => includedJobIDSet.has(i.jobID));

    groupJobs.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    });

    updateGroupJobs(groupJobs);
    updateGroupPageRefresh((prev) => !prev);
  }, [activeGroup, groupArray, jobArray]);


  const handleNameChange = (event) => {
    event.preventDefault();
    let newGroupArray = [...groupArray];
    let selectedGroup = newGroupArray.find((i) => i.groupID === activeGroup);
    selectedGroup.groupName = tempName;
    updateGroupArray(newGroupArray);
    updateEditGroupNameTrigger((prev) => !prev);
  };

  let activeGroupObject = groupArray.find((i) => i.groupID === activeGroup);

  if (!activeGroup) return <LoadingPage />;

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
      <ShoppingListDialog />
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
                  defaultValue={activeGroupObject.groupName}
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
                <Tooltip title="Save group name" arrow placement="bottom">
                <IconButton color="primary" onClick={handleNameChange}>
                  <SaveIcon />
                  </IconButton>
                  </Tooltip>
              </Grid>
            </Grid>
          ) : (
            <Grid item xs={12}>
              <Typography variant="h3" align="left" color="primary">
                {activeGroupObject.groupName}
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
                  groupID: activeGroupObject.groupID,
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
                    checked={activeGroupObject.showComplete}
                    onChange={() => {
                      activeGroupObject.showComplete =
                        !activeGroupObject.showComplete;
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
