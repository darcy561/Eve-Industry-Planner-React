import { useContext, useState } from "react";
import {
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  Grid,
  Paper,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import itemList from "../../../../../RawData/searchIndex.json";
import fullItemList from "../../../../../RawData/fullItemList.json";
import uuid from "react-uuid";
import useBuildNewJobs from "../../../../../Hooks/JobHooks/useBuildNewJobs";
import useRightContentDrawer from "../../../../SideMenu/Hooks/rightContentMenuHooks";
import AddShipFittingPanel from "./FittingImport/addFittingJobs";
import { DataExchangeContext } from "../../../../../Context/LayoutContext";

function AddNewJobContentPanel({
  hideRightContentPanel,
  rightContentMenuContentID,
  updateRightContentMenuContentID,
}) {
  const [itemIDsToAdd, updateItemIDsToAdd] = useState([]);
  const { updateDataExchange } = useContext(DataExchangeContext);
  const { addNewJobsToPlanner } = useBuildNewJobs();
  const { toggleRightDrawerColapse } = useRightContentDrawer();

  const deviceNotMobile = useMediaQuery((theme) => theme.breakpoints.up("sm"));

  async function addJobs() {
    updateDataExchange(true);
    await addNewJobsToPlanner(itemIDsToAdd);
    updateItemIDsToAdd([]);
    toggleRightDrawerColapse(
      1,
      rightContentMenuContentID,
      hideRightContentPanel
    );
    updateRightContentMenuContentID(null);
    updateDataExchange(false);
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

  const deviceBasedWidth = deviceNotMobile ? "100%" : "60%";

  return (
    <Paper
      elevation={3}
      square
      sx={{ padding: 2, height: "100%", width: "100%", overflow: "hidden" }}
    >
      <Box sx={{ height: "100%", width: deviceBasedWidth }}>
        <Box
          sx={{
            height: "40%",
            width: "100%",
            overflowX: "hidden",
            overflowY: "auto",
          }}
        >
          <Grid
            container
            item
            sx={{
              alignContent: "flex-start",
            }}
          >
            <Grid container item>
              <Grid item xs={12}>
                <Typography>Add New Jobs</Typography>
              </Grid>
              <Grid item xs={12} sx={{ paddingBottom: 2 }}>
                <Autocomplete
                  fullWidth
                  id="Recipe Search"
                  blurOnSelect
                  clearOnBlur
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
            <Grid container item xs={12} sx={{}}>
              {itemIDsToAdd.map((itemObj) => {
                const itemName = fullItemList[itemObj.itemID]?.name;
                return (
                  <Grid item xs="auto" key={uuid()}>
                    <Chip
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
        </Box>
        <AddShipFittingPanel updateItemIDsToAdd={updateItemIDsToAdd} />
      </Box>
    </Paper>
  );
}

export default AddNewJobContentPanel;
