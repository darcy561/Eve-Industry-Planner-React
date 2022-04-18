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
  MultiSelectJobPlannerContext,
  PriceEntryListContext,
  ShoppingListContext,
} from "../../../Context/LayoutContext";
import { JobArrayContext } from "../../../Context/JobContext";
import { SisiDataFilesContext } from "../../../Context/EveDataContext";

import { makeStyles } from "@mui/styles";

const useStyles = makeStyles((theme) => ({
  Autocomplete: {
    "& .MuiInputBase-input.MuiAutocomplete-input": {
      color:
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

export function SearchBar() {
  const { jobArray } = useContext(JobArrayContext);
  const { DataExchange } = useContext(DataExchangeContext);
  const { updateShoppingListData } = useContext(ShoppingListContext);
  const { updatePriceEntryListData } = useContext(PriceEntryListContext);
  const { updateDialogData } = useContext(DialogDataContext);
  const { sisiDataFiles, updateSisiDataFiles } =
    useContext(SisiDataFilesContext);
  const { multiSelectJobPlanner, updateMultiSelectJobPlanner } = useContext(
    MultiSelectJobPlannerContext
  );
  const {
    deleteMultipleJobsProcess,
    massBuildMaterials,
    mergeJobs,
    moveMultipleJobsBackward,
    moveMultipleJobsForward,
    newJobProcess,
    buildShoppingList,
    buildItemPriceEntry,
  } = useJobManagement();
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
              disableClearable={true}
              fullWidth
              freeSolo
              id="Recipe Search"
              clearOnBlur={true}
              blurOnSelect={true}
              variant="standard"
              size="small"
              options={itemList}
              getOptionLabel={(option) => option.name}
              onChange={(event, value) => {
                if (value != null) {
                  newJobProcess(value.itemID, null);
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  label="Item Search"
                  className={classes.Autocomplete}
                  margin="none"
                  variant="standard"
                  style={{ background: "white", borderRadius: "5px" }}
                  InputProps={{ ...params.InputProps, type: "search" }}
                />
              )}
            />
          </Grid>

          <Grid item xs={1} sx={{ paddingLeft: { xs: "5px", md: "20px" } }}>
            {DataExchange && <CircularProgress size="24px" edge="false" />}
          </Grid>
          <Grid container item xs={12} sm={6} xl={3} alignItems="center">
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
          </Grid>
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
              title="Displays a shopping list of the remaining materials to build all of the selected jobs."
              arrow
            >
              <Button
                variant="outlined"
                size="small"
                sx={{ marginRight: "10px" }}
                onClick={async () => {
                  if (multiSelectJobPlanner.length > 0) {
                    let shoppingList = await buildShoppingList(
                      multiSelectJobPlanner
                    );
                    updateShoppingListData((prev) => ({
                      open: true,
                      list: shoppingList,
                    }));
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
                    moveMultipleJobsBackward(multiSelectJobPlanner);
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
                    moveMultipleJobsForward(multiSelectJobPlanner);
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
                      mergeJobs(multiSelectJobPlanner);
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
                  jobArray.forEach((job) => {
                    newMultiArray.push(job);
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
        </Grid>
      </Grid>
    </Paper>
  );
}
