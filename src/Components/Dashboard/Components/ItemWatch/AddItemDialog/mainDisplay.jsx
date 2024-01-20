import {
  FormControl,
  FormHelperText,
  Grid,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import { ChildJobItem } from "./childJobItem";
import { useContext, useState } from "react";
import { UserWatchlistContext } from "../../../../../Context/AuthContext";
import { WatchListSetupOptions_WatchlistDialog } from "./watchlistOptions";

export function EditItemDisplay_WatchlistDialog({
  parentUser,
  watchlistItemRequest,
  updateWatchlistItemRequest,
  setImportedJob,
  materialJobs,
  setMaterialJobs,
  groupSelect,
  updateGroupSelect,
}) {
  const { userWatchlist } = useContext(UserWatchlistContext);
  const [itemToModify, updateItemToModify] = useState(watchlistItemRequest);
  return (
    <Grid item xs={12}>
      <Grid
        container
        item
        xs={12}
        onClick={() => {
          updateItemToModify(watchlistItemRequest);
        }}
      >
        <Grid item xs={12} align="center">
          <img
            src={`https://images.evetech.net/types/${watchlistItemRequest}/icon?size=64 `}
            alt=""
          />
        </Grid>
        <Grid
          item
          xs={12}
          align="center"
          sx={{
            marginBottom: "20px",
          }}
        >
          <Typography
            color={itemToModify === watchlistItemRequest ? "primary" : null}
            sx={{
              textDecoration:
                itemToModify === watchlistItemRequest ? "underline" : null,
            }}
          >
            {materialJobs[watchlistItemRequest].name}
          </Typography>
        </Grid>
      </Grid>
      <Grid container item xs={12} sx={{ marginBottom: "20px" }}>
        {Object.values(materialJobs).map((job) => {
          if (job.itemID === watchlistItemRequest) return null;
          return (
            <ChildJobItem
              key={job.jobID}
              job={job}
              itemToModify={itemToModify}
              updateItemToModify={updateItemToModify}
            />
          );
        })}
      </Grid>

      <WatchListSetupOptions_WatchlistDialog
        parentUser={parentUser}
              setImportedJob={setImportedJob}
              watchlistItemRequest={watchlistItemRequest}
        materialJobs={materialJobs}
        setMaterialJobs={setMaterialJobs}
        itemToModify={itemToModify}
        updateItemToModify={updateItemToModify}
      />

      <Grid item xs={6} sx={{ paddingRight: "10px", marginTop: "20px" }}>
        <FormControl
          sx={{
            "& .MuiFormHelperText-root": {
              color: (theme) => theme.palette.secondary.main,
            },
            "& input::-webkit-clear-button, & input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
              {
                display: "none",
              },
          }}
          fullWidth
        >
          <Select
            variant="standard"
            size="small"
            value={groupSelect}
            onChange={(e) => {
              updateGroupSelect(e.target.value);
            }}
          >
            <MenuItem value={0}>Clear</MenuItem>
            {userWatchlist.groups.map((entry) => {
              return (
                <MenuItem key={entry.id} value={entry.id}>
                  {entry.name}
                </MenuItem>
              );
            })}
          </Select>
          <FormHelperText variant="standard">Watchlist Group</FormHelperText>
        </FormControl>
      </Grid>
    </Grid>
  );
}
