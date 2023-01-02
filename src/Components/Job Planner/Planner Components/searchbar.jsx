import { useContext } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Grid,
  Paper,
  TextField,
  Tooltip,
} from "@mui/material";
import itemList from "../../../RawData/searchIndex.json";
import { useJobManagement } from "../../../Hooks/useJobManagement";
import {
  DataExchangeContext,
  DialogDataContext,
  JobPlannerPageTriggerContext,
  MultiSelectJobPlannerContext,
  PriceEntryListContext,
} from "../../../Context/LayoutContext";
import { ActiveJobContext, JobArrayContext } from "../../../Context/JobContext";
import { SisiDataFilesContext } from "../../../Context/EveDataContext";

import { makeStyles } from "@mui/styles";
import { UserJobSnapshotContext } from "../../../Context/AuthContext";
import { useGroupManagement } from "../../../Hooks/useGroupManagement";

const useStyles = makeStyles((theme) => ({
  Autocomplete: {
    "& .MuiInputBase-input.MuiAutocomplete-input.MuiAutocomplete-inputRoot": {
      color:
        theme.palette.type === "dark" ? "black" : theme.palette.secondary.main,
      borderColor:
        theme.palette.type === "dark" ? "black" : theme.palette.secondary.main,
    },
  },
  Checkbox: {
    color:
      theme.palette.type === "dark"
        ? theme.palette.primary.main
        : theme.palette.secondary.main,
  },
}));

export function SearchBar({
  updateShoppingListTrigger,
  updateShoppingListData,
}) {
  const { updateEditGroupTrigger } = useContext(JobPlannerPageTriggerContext);
  const { DataExchange } = useContext(DataExchangeContext);
  const { updatePriceEntryListData } = useContext(PriceEntryListContext);
  const { updateDialogData } = useContext(DialogDataContext);
  const { userJobSnapshot } = useContext(UserJobSnapshotContext);
  const { sisiDataFiles, updateSisiDataFiles } =
    useContext(SisiDataFilesContext);
  const { multiSelectJobPlanner, updateMultiSelectJobPlanner } = useContext(
    MultiSelectJobPlannerContext
  );
  const { updateActiveGroup } = useContext(ActiveJobContext);
  const {
    deleteMultipleJobsProcess,
    massBuildMaterials,
    mergeJobsNew,
    moveItemsBackward,
    moveItemsForward,
    newJobProcess,
    buildItemPriceEntry,
  } = useJobManagement();
  const { createNewGroupWithJobs } = useGroupManagement();
  const classes = useStyles();

  return (
    <Paper
      sx={{
        padding: "20px",
        marginRight: { md: "10px" },
        marginLeft: { md: "10px" },
      }}
      elevation={3}
      square={true}
    >
      <Grid container direction="row" alignItems="center">
        <Grid container item xs={12}>
          <Grid item xs={11} sm={5} md={4} xl={2}>
            <Autocomplete
              disableClearable
              fullWidth
              id="Recipe Search"
              clearOnBlur
              blurOnSelect
              variant="standard"
              size="small"
              options={itemList}
              getOptionLabel={(option) => option.name}
              onChange={(event, value) => {
                newJobProcess({ itemID: value.itemID });
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

          <Grid
            container
            item
            xs={1}
            alignItems="center"
            sx={{ paddingLeft: { xs: "5px", md: "20px" } }}
          >
            {DataExchange && <CircularProgress size="24px" edge="false" />}
          </Grid>
          {/* <Grid container item xs={12} sm={6} xl={3} alignItems="center">
            <FormControlLabel
              label="Use Recipes From Upcoming Changes On Singularity"
              control={
                <Checkbox
                  className={classes.Checkbox}
                  size="small"
                  checked={sisiDataFiles}
                  onChange={() => {
                    updateSisiDataFiles((prev) => !prev);
                  }}
                />
              }
            ></FormControlLabel>
          </Grid> */}
        </Grid>

        <Grid
          container
          item
          xs={12}
          xl={9}
          sx={{ marginTop: "20px" }}
          align="center"
        >
          <Grid
            item
            xs={12}
            md="auto"
            align="center"
            sx={{ marginBottom: { xs: "10px", md: "0px" } }}
          >
            <Tooltip
              title="Displays a shopping list of the remaining materials needed to build all of the selected jobs."
              arrow
            >
              <Button
                variant="outlined"
                size="small"
                sx={{ marginRight: "10px" }}
                onClick={async () => {
                  if (multiSelectJobPlanner.length > 0) {
                    updateShoppingListTrigger((prev) => !prev);
                    updateShoppingListData(multiSelectJobPlanner);
                  } else {
                    updateDialogData((prev) => ({
                      ...prev,
                      buttonText: "Close",
                      id: "Empty-Multi-Select",
                      open: true,
                      title: "Oops",
                      body: "You will need to select at least 1 job using the checkbox's on the job cards.",
                    }));
                  }
                }}
              >
                Shopping List
              </Button>
            </Tooltip>

            <Tooltip
              title="Sets up new jobs to build the combined ingrediant totals of each selected job cards."
              arrow
            >
              <Button
                variant="outlined"
                size="small"
                sx={{ marginRight: "10px" }}
                onClick={() => {
                  if (multiSelectJobPlanner.length > 0) {
                    massBuildMaterials(multiSelectJobPlanner);
                    updateMultiSelectJobPlanner([]);
                  } else {
                    updateDialogData((prev) => ({
                      ...prev,
                      buttonText: "Close",
                      id: "Empty-Multi-Select",
                      open: true,
                      title: "Oops",
                      body: "You will need to select at least 1 job using the checkbox's on the job cards.",
                    }));
                  }
                }}
              >
                Add Ingredient Jobs
              </Button>
            </Tooltip>
          </Grid>
          <Grid
            item
            xs={12}
            md="auto"
            align="center"
            sx={{ marginBottom: { xs: "10px", md: "0px" } }}
          >
            <Tooltip
              title="Displays a list of the remaining materials to purchase for all of the selected jobs."
              arrow
            >
              <Button
                variant="outlined"
                size="small"
                sx={{ marginRight: "10px" }}
                onClick={async () => {
                  if (multiSelectJobPlanner.length > 0) {
                    let itemList = await buildItemPriceEntry(
                      multiSelectJobPlanner
                    );

                    updatePriceEntryListData((prev) => ({
                      ...prev,
                      open: true,
                      list: itemList,
                    }));
                  } else {
                    updateDialogData((prev) => ({
                      ...prev,
                      buttonText: "Close",
                      id: "Empty-Multi-Select",
                      open: true,
                      title: "Oops",
                      body: "You will need to select at least 1 job using the checkbox's on the job cards",
                    }));
                  }
                }}
              >
                Add Item Costs
              </Button>
            </Tooltip>
          </Grid>
          <Grid
            item
            xs={12}
            md="auto"
            align="center"
            sx={{ marginBottom: { xs: "10px", md: "0px" } }}
          >
            <Tooltip title="Moves the selected jobs 1 step backwards." arrow>
              <Button
                variant="outlined"
                size="small"
                sx={{ marginRight: "10px" }}
                onClick={() => {
                  if (multiSelectJobPlanner.length > 0) {
                    moveItemsBackward(multiSelectJobPlanner);
                  } else {
                    updateDialogData((prev) => ({
                      ...prev,
                      buttonText: "Close",
                      id: "Empty-Multi-Select",
                      open: true,
                      title: "Oops",
                      body: "You will need to select at least 1 job using the checkbox's on the job cards",
                    }));
                  }
                }}
              >
                Move Backward
              </Button>
            </Tooltip>
            <Tooltip title="Moves the selected jobs 1 step forwards." arrow>
              <Button
                variant="outlined"
                size="small"
                sx={{ marginRight: "10px" }}
                onClick={() => {
                  if (multiSelectJobPlanner.length > 0) {
                    moveItemsForward(multiSelectJobPlanner);
                  } else {
                    updateDialogData((prev) => ({
                      ...prev,
                      buttonText: "Close",
                      id: "Empty-Multi-Select",
                      open: true,
                      title: "Oops",
                      body: "You will need to select at least 1 job using the checkbox's on the job cards",
                    }));
                  }
                }}
              >
                Move Forward
              </Button>
            </Tooltip>
          </Grid>

          <Grid
            item
            xs={12}
            md="auto"
            align="center"
            sx={{ marginBottom: { xs: "20px", md: "0px" } }}
          >
            <Tooltip title="Merges the selected jobs into one." arrow>
              <Box>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ marginRight: "10px" }}
                  disabled={
                    !multiSelectJobPlanner.every(
                      (i) => i.itemID === multiSelectJobPlanner[0].itemID
                    )
                  }
                  onClick={() => {
                    if (multiSelectJobPlanner.length > 1) {
                      mergeJobsNew(multiSelectJobPlanner);
                      updateMultiSelectJobPlanner([]);
                    } else {
                      updateDialogData((prev) => ({
                        ...prev,
                        buttonText: "Close",
                        id: "Empty-Multi-Select",
                        open: true,
                        title: "Oops",
                        body: "You will need to select at least 2 matching jobs using the checkbox's on the job cards",
                      }));
                    }
                  }}
                >
                  Merge Jobs
                </Button>
              </Box>
            </Tooltip>
          </Grid>

          <Grid
            item
            xs={12}
            md="auto"
            align="center"
            sx={{ marginBottom: { xs: "10px", md: "0px" } }}
          >
            <Tooltip title="Selects all jobs on the job planner." arrow>
              <Button
                variant="outlined"
                size="small"
                sx={{ marginRight: "10px" }}
                onClick={() => {
                  let newMultiArray = [...multiSelectJobPlanner];
                  userJobSnapshot.forEach((job) => {
                    newMultiArray.push(job.jobID);
                  });
                  updateMultiSelectJobPlanner(newMultiArray);
                }}
              >
                Select All
              </Button>
            </Tooltip>

            <Tooltip title="Clears the selected jobs." arrow>
              <Box sx={{ display: "inline" }}>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={!multiSelectJobPlanner.length > 0}
                  sx={{ marginRight: "10px" }}
                  onClick={() => {
                    updateMultiSelectJobPlanner([]);
                  }}
                >
                  Clear Selection
                </Button>
              </Box>
            </Tooltip>
          </Grid>

          <Grid item xs={12} md="auto" align="center">
            <Tooltip title="Deletes the selected jobs from the planner." arrow>
              <Button
                variant="outlined"
                size="small"
                color="error"
                onClick={() => {
                  if (multiSelectJobPlanner.length > 0) {
                    deleteMultipleJobsProcess(multiSelectJobPlanner);
                    updateMultiSelectJobPlanner([]);
                  } else {
                    updateDialogData((prev) => ({
                      ...prev,
                      buttonText: "Close",
                      id: "Empty-Multi-Select",
                      open: true,
                      title: "Oops",
                      body: "You will need to select atleast 1 job using the checkbox's on the job cards",
                    }));
                  }
                }}
              >
                Delete
              </Button>
            </Tooltip>
          </Grid>
          <Grid item xs={12} md="auto" align="center">
            <Button
              variant="outlined"
              size="small"
              onClick={async () => {
                let newGroup = await createNewGroupWithJobs(
                  multiSelectJobPlanner
                );
                updateActiveGroup(newGroup);
                updateMultiSelectJobPlanner([]);
                updateEditGroupTrigger((prev) => !prev);
              }}
            >
              New Group
            </Button>
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
}
