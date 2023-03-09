import {
  Autocomplete,
  Grid,
  IconButton,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import DoneIcon from "@mui/icons-material/Done";
import { useContext, useEffect, useState } from "react";
import { ActiveJobContext, JobArrayContext } from "../../../Context/JobContext";
import { OutputJobsPanel } from "./OutputJobs";
import { GroupAccordion } from "./groupAccordion";
import { useGroupManagement } from "../../../Hooks/useGroupManagement";
import { UserJobSnapshotContext } from "../../../Context/AuthContext";
import { makeStyles } from "@mui/styles";
import { GroupOptionsBar } from "./groupOptions";
import { useJobManagement } from "../../../Hooks/useJobManagement";
import itemList from "../../../RawData/searchIndex.json";

const useStyles = makeStyles((theme) => ({
  TextField: {
    "& .MuiFormHelperText-root": {
      color: theme.palette.secondary.main,
    },
    "& input::-webkit-clear-button, & input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
      {
        display: "none",
      },
  },
}));

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
  const { closeGroup } = useGroupManagement();
  const { newJobProcess } = useJobManagement();
  const classes = useStyles();

  useEffect(() => {
    if (activeGroup !== null) {
      let returnArray = [];
      updateGroupPageRefresh((prev) => !prev);
      for (let jobID of activeGroup.includedJobIDs) {
        let job = jobArray.find((i) => i.jobID === jobID);
        if (job === undefined) {
          continue;
        }
        returnArray.push(job);
      }
      updateGroupJobs(returnArray);
      updateGroupPageRefresh((prev) => !prev);
    }
  }, [activeGroup, jobArray, userJobSnapshot]);

  const handleNameChange = (event) => {
    event.preventDefault();
    updateActiveGroup((prev) => ({
      ...prev,
      groupName: tempName,
    }));
    updateEditGroupNameTrigger((prev) => !prev);
  };

  if (!groupPageRefresh) {
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
        <Grid container>
          <Grid item xs={7} md={9} lg={10} />
          <Grid item xs={5} md={3} lg={2} align="right">
            <Tooltip arrow title="Edit Group Name" placement="bottom">
              <IconButton
                color="primary"
                onClick={() => {
                  updateEditGroupNameTrigger((prev) => !prev);
                }}
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
                    className={classes.TextField}
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
            <Grid item xs={12} align="right">
              <Autocomplete
                disableClearable
                fullWidth
                id="recipeSearch"
                clearOnBlur
                variant="standard"
                size="small"
                options={itemList}
                getOptionLabel={(option) => option.name}
                onChange={(event, value) => {
                  newJobProcess({
                    itemID: value.itemID,
                    groupID: activeGroup.groupID,
                  });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    label="Item Search"
                    className={classes.Autocomplete}
                    margin="none"
                    variant="standard"
                    style={{ borderRadius: "5px" }}
                    InputProps={{ ...params.InputProps, type: "search" }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <GroupOptionsBar
                updateShoppingListTrigger={updateShoppingListTrigger}
                updateShoppingListData={updateShoppingListData}
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
  } else {
    <Paper>Refresh</Paper>;
  }
}
