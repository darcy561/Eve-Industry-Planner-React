import {
  Autocomplete,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import itemList from "../../../../RawData/searchIndex.json";
import { useContext, useState } from "react";
import { useJobBuild } from "../../../../Hooks/useJobBuild";
import { useFirebase } from "../../../../Hooks/useFirebase";
import { EvePricesContext } from "../../../../Context/EveDataContext";
import { jobTypes } from "../../../../Context/defaultValues";
import { WishListManufacturingOptions } from "./wishlistManufacturingOptions";
import { WishlistReactionOptions } from "./wishlistReactionOptions";
import { ChildJobEntry } from "./childJobSelect";

export function AddWatchItemDialog({ openDialog, setOpenDialog }) {
  const { buildJob } = useJobBuild();
  const { getItemPrices } = useFirebase();
  const { updateEvePrices } = useContext(EvePricesContext);
  const [loadingState, changeLoadingState] = useState(false);
  const [loadingText, changeLoadingText] = useState(null);
  const [failedImport, setFailedImport] = useState(false);
  const [importedJob, setImportedJob] = useState(null);
  const [materialJobs, setMaterialJobs] = useState([]);

  const handleClose = () => {
    setOpenDialog(false);
    changeLoadingState(false);
    setMaterialJobs([]);
    setImportedJob(null);
  };

  return (
    <Dialog open={openDialog} onClose={handleClose} sx={{ padding: "20px" }}>
      {/* <DialogTitle align="center" color="primary">
        Add Watchlist Item
      </DialogTitle> */}
      <DialogContent>
        <Grid container>
          {importedJob === null ? (
            <Grid item xs={12} sx={{ marginBottom: "40px" }}>
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
                  changeLoadingState(true);
                  changeLoadingText("Importing Item Data...");
                  let newJob = await buildJob(value.itemID, null);
                  if (newJob !== undefined) {
                    let priceIDRequest = new Set();
                    let jobPromiseArray = [];
                    priceIDRequest.add(newJob.itemID);
                    for (let mat of newJob.build.materials) {
                      priceIDRequest.add(mat.typeID);
                      if (
                        mat.jobType === jobTypes.manufacturing ||
                        mat.jobType === jobTypes.reaction
                      ) {
                        jobPromiseArray.push(
                          buildJob(mat.typeID, mat.quantity)
                        );
                      }
                    }
                    changeLoadingText("Importing Material Data...");
                    let returnJobPromiseArray = await Promise.all(
                      jobPromiseArray
                    );
                    console.log(returnJobPromiseArray);
                    for (let childJob of returnJobPromiseArray) {
                      for (let mat of childJob.build.materials) {
                        priceIDRequest.add(mat.typeID);
                      }
                    }

                    changeLoadingText("Importing Missing Pricing Data...");
                    let returnPricePromiseArray = await getItemPrices([
                      ...priceIDRequest,
                    ]);

                    updateEvePrices((prev) =>
                      prev.concat(returnPricePromiseArray[0])
                    );
                    setMaterialJobs(returnJobPromiseArray);
                    setImportedJob(newJob);
                    console.log(newJob);
                  } else {
                    changeLoadingText("Error Importing Data...");
                    setFailedImport(true);
                  }
                  changeLoadingState(false);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    label="Search"
                    nargin="none"
                    variant="standard"
                    InputProps={{ ...params.InputProps, type: "search" }}
                  />
                )}
              />
            </Grid>
          ) : null}
          {!failedImport ? (
            importedJob === null ? (
              !loadingState ? (
                <Grid item xs={12} align="center">
                  <Typography> Select An Item To Begin</Typography>
                </Grid>
              ) : (
                <Grid item xs={12} align="center">
                  <CircularProgress color="primary" />
                  <Typography sx={{ marginTop: "20px" }}>
                    {loadingText}
                  </Typography>
                </Grid>
              )
            ) : (
              <>
                <Grid item xs={12} align="center">
                  <img
                    src={`https://images.evetech.net/types/${importedJob.itemID}/icon?size=64 `}
                    alt=""
                  />
                </Grid>
                <Grid item xs={12} align="center" sx={{ marginBottom: "20px" }}>
                  <Typography>{importedJob.name}</Typography>
                </Grid>

                <Grid container item xs={12} sx={{ marginBottom: "20px" }}>
                  {materialJobs.map((job) => {
                    return <ChildJobEntry job={job} />;
                  })}
                </Grid>
                {importedJob.jobType === jobTypes.manufacturing && (
                  <WishListManufacturingOptions
                    importedJob={importedJob}
                    setImportedJob={setImportedJob}
                    materialJobs={materialJobs}
                    setMaterialJobs={setMaterialJobs}
                  />
                )}
                {importedJob.jobType === jobTypes.reaction && (
                  <WishlistReactionOptions
                    importedJob={importedJob}
                    setImportedJob={setImportedJob}
                    materialJobs={materialJobs}
                    setMaterialJobs={setMaterialJobs}
                  />
                )}
              </>
            )
          ) : (
            <Grid item xs={12}>
              <Typography color="error" sx={{ marginTop: "20px" }}>
                {loadingText}
              </Typography>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" size="small" onClick={handleClose}>
          Close
        </Button>
        <Button variant="contained" size="small">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
