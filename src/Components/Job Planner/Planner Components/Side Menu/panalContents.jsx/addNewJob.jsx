import { useState } from "react";
import {
  Autocomplete,
  Avatar,
  Button,
  Chip,
  Grid,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import itemList from "../../../../../RawData/searchIndex.json";
import fullItemList from "../../../../../RawData/fullItemList.json";
import uuid from "react-uuid";
import useBuildNewJobs from "../../../../../Hooks/JobHooks/useBuildNewJobs";
import useRightContentDrawer from "../../../../SideMenu/Hooks/rightContentMenuHooks";
import AddShipFittingPanel from "./FittingImport/addFittingJobs";

function AddNewJobContentPanel({
  hideRightContentPanel,
  rightContentMenuContentID,
  updateRightContentMenuContentID,
}) {
  const [itemIDsToAdd, updateItemIDsToAdd] = useState([]);
  const { addNewJobsToPlanner } = useBuildNewJobs();
  const { toggleRightDrawerColapse } = useRightContentDrawer();

  async function addJobs() {
    await addNewJobsToPlanner(itemIDsToAdd);
    updateItemIDsToAdd([]);
    toggleRightDrawerColapse(
      1,
      rightContentMenuContentID,
      hideRightContentPanel
    );
    updateRightContentMenuContentID(null);
  }

  function addItemToSelection(inputID) {
    const newItemsToAdd = [...itemIDsToAdd];

    const existingObject = newItemsToAdd.find((i) => i.itemID === inputID);

    if (existingObject) {
      existingObject.itemQty++;
    } else {
      newItemsToAdd.push({
        itemID: inputID,
        itemQty: 1,
      });
    }

    updateItemIDsToAdd(newItemsToAdd);
  }

  return (
    <Paper
      elevation={3}
      square
      sx={{ padding: 2, maxHeight: "100%", width: "100%", }}
    >
      <Grid contianer item xs={12} sx={{ height: "100%" }}>
        <Grid
          container
          item
          sx={{
            height: "40%",
            alignContent: "flex-start",
          }}
        >
          <Grid container item sx={{ flexGrow: 1 }}>
            <Grid item xs={12}>
              <Typography>Add New Jobs</Typography>
            </Grid>
            <Grid item xs={12} sx={{ paddingBottom: 2 }}>
              <Autocomplete
                disableClearable
                fullWidth
                id="Recipe Search"
                clearOnBlur
                blurOnSelect
                size="small"
                options={itemList}
                getOptionLabel={(option) => option.name}
                onChange={(event, value) => {
                  addItemToSelection(value.itemID);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    margin="none"
                    variant="standard"
                    InputProps={{ ...params.InputProps, type: "search" }}
                  />
                )}
              />
            </Grid>
            <Grid
              item
              xs={12}
              sx={{ display: "flex", justifyContent: "space-evenly" }}
            >
              <Button
                size="small"
                variant="contained"
                disabled={itemIDsToAdd.length < 1}
                onClick={addJobs}
              >
                Add
              </Button>
              <Button
                size="small"
                variant="contained"
                disabled={itemIDsToAdd.length < 1}
                onClick={() => updateItemIDsToAdd([])}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
          <Grid
            container
            item
            xs={12}
            sx={{
              maxHeight: "80%",
              overflow: "auto", // Add overflow property to enable scrolling
            }}
          >
            {itemIDsToAdd.map((itemObj) => {
              const itemName = fullItemList[itemObj.itemID]?.name;
              return (
                <Grid item xs="auto">
                  <Chip
                    key={uuid()}
                    label={itemName}
                    size="small"
                    deleteIcon={<ClearIcon />}
                    onDelete={() => {
                      updateItemIDsToAdd((prev) =>
                        prev.filter((i) => i.itemID !== itemObj.itemID)
                      );
                    }}
                    avatar={
                      <Avatar
                        src={`https://image.eveonline.com/Type/${itemObj.itemID}_32.png`}
                      />
                    }
                    variant="outlined"
                    sx={{
                      margin: 0.5,
                      "& .MuiChip-deleteIcon": {
                        color: "error.main",
                      },
                      boxShadow: 3,
                    }}
                  />
                </Grid>
              );
            })}
          </Grid>
        </Grid>

        <Grid
          container
          item
          sx={{
            backgroundColor: "red",
            height: "60%",
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          <AddShipFittingPanel updateItemIDsToAdd={updateItemIDsToAdd} />
        </Grid>
      </Grid>
    </Paper>
  );
}

export default AddNewJobContentPanel;
