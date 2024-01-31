import { Autocomplete, Grid, TextField, Typography } from "@mui/material";
import itemList from "../../../../../RawData/searchIndex.json";
import { useJobBuild } from "../../../../../Hooks/useJobBuild";
import { useJobManagement } from "../../../../../Hooks/useJobManagement";
import { useFirebase } from "../../../../../Hooks/useFirebase";
import { jobTypes } from "../../../../../Context/defaultValues";
import { useContext, useEffect } from "react";
import { EvePricesContext } from "../../../../../Context/EveDataContext";
import { UserWatchlistContext } from "../../../../../Context/AuthContext";

export function ImportNewJob_WatchlistDialog({
  parentUser,
  setFailedImport,
  changeLoadingText,
  setMaterialJobs,
  updateSaveReady,
  changeLoadingState,
  updateWatchlistItemRequest,
  watchlistItemToEdit,
  updateGroupSelect,
}) {
  const { userWatchlist } = useContext(UserWatchlistContext);
  const { updateEvePrices } = useContext(EvePricesContext);
  const { buildJob } = useJobBuild();
  const { generatePriceRequestFromJob } = useJobManagement();
  const { getItemPrices } = useFirebase();

  useEffect(() => {
    async function findJobToEdit() {
      if (!watchlistItemToEdit) return;
      await importWatchlistItem(
        userWatchlist.items[watchlistItemToEdit].typeID
      );
      updateGroupSelect(userWatchlist.items[watchlistItemToEdit].group);
    }
    findJobToEdit();
  }, []);

  async function importWatchlistItem(requestedID) {
    changeLoadingState(true);
    changeLoadingText("Importing Item Data...");
    let materialMap = {};

    const WatchlistItemJob = await buildJob({
      itemID: requestedID,
    });

    if (!WatchlistItemJob) {
      changeLoadingText("Error Importing Data...");
      setFailedImport(true);
      changeLoadingState(false);
      return;
    }

    let itemPricesSet = new Set(generatePriceRequestFromJob(WatchlistItemJob));
    materialMap[WatchlistItemJob.itemID] = WatchlistItemJob;
    const materialJobRequests = WatchlistItemJob.build.materials.reduce(
      (prev, material) => {
        if (
          material.jobType === jobTypes.manufacturing ||
          material.jobType === jobTypes.reaction
        ) {
          prev.push({ itemID: material.typeID });
        }
        return prev;
      },
      []
    );

    const MaterialJobs = await buildJob(materialJobRequests);

    for (let job of MaterialJobs) {
      itemPricesSet = new Set([
        ...itemPricesSet,
        ...generatePriceRequestFromJob(job),
      ]);
      materialMap[job.itemID] = job;
    }

    const itemPriceResult = await getItemPrices([...itemPricesSet], parentUser);
    updateEvePrices((prev) => ({
      ...prev,
      ...itemPriceResult,
    }));
    updateWatchlistItemRequest(WatchlistItemJob.itemID);
    setMaterialJobs(materialMap);
    updateSaveReady(true);
    changeLoadingState(false);
  }

  return (
    <Grid item xs={12} sx={{ marginBottom: "40px" }}>
      <Grid item xs={12} align="center">
        <Typography> Select An Item To Begin</Typography>
      </Grid>
      <Autocomplete
        disableClearable
        fullWidth
        id="Item Search"
        clearOnBlur
        blurOnSelect
        variant="standard"
        size="small"
        options={itemList}
        getOptionLabel={(option) => option.name}
        onChange={async (event, value) => {
          await importWatchlistItem(value.itemID);
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            size="small"
            label="Search"
            nargin="none"
            variant="standard"
            InputProps={{ ...params.InputProps, type: "Search" }}
          />
        )}
      />
    </Grid>
  );
}
