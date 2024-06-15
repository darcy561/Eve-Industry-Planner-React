import { useContext, useState } from "react";
import {
  Autocomplete,
  CircularProgress,
  Grid,
  Paper,
  TextField,
} from "@mui/material";
import itemList from "../../../RawData/searchIndex.json";
import { DataExchangeContext } from "../../../Context/LayoutContext";
import useBuildNewJobs from "../../../Hooks/JobHooks/useBuildNewJobs";

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
          <Grid item xs={11} sm={5} md={4} xl={2}>
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
            container
            item
            xs={1}
            alignItems="center"
            sx={{ paddingLeft: { xs: "5px", md: "20px" } }}
          >
            {DataExchange && <CircularProgress size="24px" edge="false" />}
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
}
