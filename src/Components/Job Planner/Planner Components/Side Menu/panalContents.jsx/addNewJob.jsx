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
import { useJobManagement } from "../../../../../Hooks/useJobManagement";
import uuid from "react-uuid";

function AddNewJobContentPanel() {
  const [itemIDsToAdd, updateItemIDsToAdd] = useState([]);
  const { newJobProcess } = useJobManagement();
  console.log(itemIDsToAdd);

  function addJobs() {
    newJobProcess(
      itemIDsToAdd.map((i) => {
        return {
          itemID: i,
        };
      })
    );
  }

  return (
    <Paper
      elevation={3}
      square
      sx={{ padding: 2, height: "100%", width: "100%" }}
    >
      <Grid container>
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
            variant="standard"
            size="small"
            options={itemList}
            getOptionLabel={(option) => option.name}
            onChange={(event, value) => {
              updateItemIDsToAdd((prev) => [...prev, value.itemID]);
              // newJobProcess({ itemID: value.itemID });
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
        <Grid item xs={12} align="right">
          <Button
            size="small"
            variant="contained"
            disabled={itemIDsToAdd.length < 1}
            onClick={addJobs}
          >
            Add
          </Button>
        </Grid>
        <Grid item xs={12}>
          {itemIDsToAdd.map((ID) => {
            const itemName = fullItemList[ID]?.name;
            return (
              <Chip
                key={uuid()}
                label={itemName}
                size="small"
                deleteIcon={<ClearIcon />}
                onDelete={() => {
                  updateItemIDsToAdd((prev) => prev.filter((i) => i !== ID));
                }}
                avatar={
                  <Avatar
                    src={`https://image.eveonline.com/Type/${ID}_32.png`}
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
            );
          })}
        </Grid>
      </Grid>
    </Paper>
  );
}

export default AddNewJobContentPanel;
