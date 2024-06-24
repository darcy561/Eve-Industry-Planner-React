import { useContext, useState } from "react";
import {
  Autocomplete,
  Avatar,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  TextField,
} from "@mui/material";
import itemList from "../../../RawData/searchIndex.json";
import { DataExchangeContext } from "../../../Context/LayoutContext";
import useBuildNewJobs from "../../../Hooks/JobHooks/useBuildNewJobs";
import fullItemList from "../../../RawData/fullItemList.json";
import uuid from "react-uuid";
import ClearIcon from "@mui/icons-material/Clear";

export function SearchBar({ updateRightContentMenuContentID }) {
  const { updateDataExchange } = useContext(DataExchangeContext);
  const [itemIDsToAdd, updateItemIDsToAdd] = useState([]);
  const { addNewJobsToPlanner } = useBuildNewJobs();

  async function addJobs() {
    updateDataExchange(true);
    await addNewJobsToPlanner(itemIDsToAdd);
    updateItemIDsToAdd([]);
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

  return (
    <Paper
      sx={{
        padding: "20px",
        marginTop: "5px",
        marginRight: { md: "10px" },
        marginLeft: { md: "10px" },
      }}
      elevation={3}
      square
    >
      <Grid container direction="row" alignItems="center">
        <Grid container item xs={12}>
          <Grid item xs={12} sx={{ marginBottom: 1 }}>
            <Autocomplete
              fullWidth
              id="Recipe Search"
              blurOnSelect
              clearOnBlur
              size="small"
              options={itemList}
              getOptionLabel={(option) => option.name}
              onChange={(event, value) => {
                if (!value) return;
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
          <Grid container item xs={12}>
            {itemIDsToAdd.map((itemObj) => {
              const itemName = fullItemList[itemObj.itemID]?.name;
              return (
                <Grid item xs={"auto"} key={uuid()}>
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
          {/* <Grid
            container
            item
            xs={1}
            alignItems="center"
            sx={{ paddingLeft: { xs: "5px", md: "20px" } }}
          >
            {DataExchange && <CircularProgress size="24px" edge="false" />}
          </Grid> */}
        </Grid>
      </Grid>
    </Paper>
  );
}
