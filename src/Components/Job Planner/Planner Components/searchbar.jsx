import { useContext } from "react";
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
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
  ShoppingListContext,
} from "../../../Context/LayoutContext";
import { JobArrayContext } from "../../../Context/JobContext";

import { makeStyles } from "@mui/styles";

const useStyles = makeStyles((theme) => ({
  Autocomplete: {
    "& .MuiInputBase-input.MuiAutocomplete-input": {
      color:
        theme.palette.type === "dark" ? "black" : theme.palette.secondary.main,
    },
  },
}));

export function SearchBar({ multiSelect, updateMultiSelect }) {
  const { jobArray } = useContext(JobArrayContext);
  const { DataExchange } = useContext(DataExchangeContext);
  const { updateShoppingListData } = useContext(ShoppingListContext);
  const { updateDialogData } = useContext(DialogDataContext);
  const {
    deleteMultipleJobsProcess,
    massBuildMaterials,
    mergeJobs,
    moveMultipleJobsBackward,
    moveMultipleJobsForward,
    newJobProcess,
    buildShoppingList,
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
              title="Displays a shopping list of the remaining materials to build all of the selected jobs"
              arrow
            >
              <Button
                variant="outlined"
                size="small"
                sx={{ marginRight: "10px" }}
                onClick={async () => {
                  if (multiSelect.length > 0) {
                    let shoppingList = await buildShoppingList(multiSelect);
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
                      body: "You will need to select at least 1 job using the checkbox's on the job cards",
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
                  if (multiSelect.length > 0) {
                    massBuildMaterials(multiSelect);
                    updateMultiSelect([]);
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
            <Tooltip title="Moves the selected jobs 1 step backwards." arrow>
              <Button
                variant="outlined"
                size="small"
                sx={{ marginRight: "10px" }}
                onClick={() => {
                  if (multiSelect.length > 0) {
                    moveMultipleJobsBackward(multiSelect);
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
                  if (multiSelect.length > 0) {
                    moveMultipleJobsForward(multiSelect);
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
                    !multiSelect.every(
                      (i) => i.itemID === multiSelect[0].itemID
                    )
                  }
                  onClick={() => {
                    if (multiSelect.length > 1) {
                      mergeJobs(multiSelect);
                      updateMultiSelect([]);
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
                  let newMultiArray = [];
                  jobArray.forEach((job) => {
                    newMultiArray.push(job);
                  });
                  updateMultiSelect(newMultiArray);
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
                  disabled={!multiSelect.length > 0}
                  sx={{ marginRight: "10px" }}
                  onClick={() => {
                    updateMultiSelect([]);
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
                  if (multiSelect.length > 0) {
                    deleteMultipleJobsProcess(multiSelect);
                    updateMultiSelect([]);
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
