import {
  Autocomplete,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  FormControl,
  FormHelperText,
  Grid,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import itemList from "../../../../RawData/searchIndex.json";
import { useContext, useMemo, useState } from "react";
import { useJobBuild } from "../../../../Hooks/useJobBuild";
import { useFirebase } from "../../../../Hooks/useFirebase";
import { EvePricesContext } from "../../../../Context/EveDataContext";
import { jobTypes } from "../../../../Context/defaultValues";
import { WishListManufacturingOptions } from "./wishlistManufacturingOptions";
import { WishlistReactionOptions } from "./wishlistReactionOptions";
import { ChildJobEntry } from "./childJobSelect";
import {
  UsersContext,
  UserWatchlistContext,
} from "../../../../Context/AuthContext";
import { SnackBarDataContext } from "../../../../Context/LayoutContext";
import { getAnalytics, logEvent } from "firebase/analytics";
import { makeStyles } from "@mui/styles";

const useStyles = makeStyles((theme) => ({
  TextField: {
    "& .MuiFormHelperText-root": {
      color: theme.palette.secondary.main,
    },
    "& input::-webkit-clear-button, & input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
      {
        display: "none",
      },
  },
}));

export function AddWatchItemDialog({ openDialog, setOpenDialog }) {
  const { users } = useContext(UsersContext);
  const { userWatchlist, updateUserWatchlist } =
    useContext(UserWatchlistContext);
  const { buildJob } = useJobBuild();
  const { getItemPrices, uploadUserWatchlist } = useFirebase();
  const { updateEvePrices } = useContext(EvePricesContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const [loadingState, changeLoadingState] = useState(false);
  const [loadingText, changeLoadingText] = useState(null);
  const [failedImport, setFailedImport] = useState(false);
  const [importedJob, setImportedJob] = useState(null);
  const [materialJobs, setMaterialJobs] = useState([]);
  const [saveReady, updateSaveReady] = useState(false);
  const [groupSelect, updateGroupSelect] = useState(0);
  const analytics = getAnalytics();
  const classes = useStyles();

  const parentUser = useMemo(() => {
    return users.find((i) => i.ParentUser);
  }, [users]);

  const handleClose = () => {
    setOpenDialog(false);
    changeLoadingState(false);
    setMaterialJobs([]);
    updateSaveReady(false);
    setImportedJob(null);
  };

  const handleSave = async () => {
    let newUserWatchlistItems = [...userWatchlist.items];
    let mainJobMaterials = [];
    let childJobPresent = false;
    importedJob.build.materials.forEach((mat) => {
      let job = materialJobs.find((i) => i.itemID === mat.typeID);

      mainJobMaterials.push({
        id: Math.floor(Math.random() * 1000) + Date.now(),
        typeID: mat.typeID,
        name: mat.name,
        quantity: mat.quantity,
        quantityProduced:
          job !== undefined ? job.build.products.totalQuantity : 0,
        materials: [],
        group: groupSelect,
      });
    });
    mainJobMaterials.forEach((mat) => {
      let job = materialJobs.find((i) => i.itemID === mat.typeID);
      if (job !== undefined && job.typeID === mat.itemID) {
        job.build.materials.forEach((item) => {
          mat.materials.push({
            id: job.jobID,
            typeID: item.typeID,
            name: item.name,
            quantity: item.quantity,
          });
        });
        childJobPresent = true;
      }
    });
    newUserWatchlistItems.push({
      id: Date.now(),
      typeID: importedJob.itemID,
      group: groupSelect,
      name: importedJob.name,
      quantity: importedJob.build.products.totalQuantity,
      materials: mainJobMaterials,
      childJobPresent: childJobPresent,
    });
    newUserWatchlistItems.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    });

    updateUserWatchlist((prev) => ({ ...prev, items: newUserWatchlistItems }));
    await uploadUserWatchlist(userWatchlist.groups, newUserWatchlistItems);
    logEvent(analytics, "New Watchlist Item", {
      UID: parentUser.accountID,
    });
    setSnackbarData((prev) => ({
      ...prev,
      open: true,
      message: `${importedJob.name} Added`,
      severity: "success",
      autoHideDuration: 2000,
    }));
    handleClose();
  };

  return (
    <Dialog open={openDialog} onClose={handleClose} sx={{ padding: "20px" }}>
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
                  let newJob = await buildJob({ itemID: value.itemID });
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
                          buildJob({
                            itemID: mat.typeID,
                            itemQty: mat.quantity,
                          })
                        );
                      }
                    }
                    changeLoadingText("Importing Material Data...");
                    let returnJobPromiseArray = await Promise.all(
                      jobPromiseArray
                    );

                    for (let childJob of returnJobPromiseArray) {
                      for (let mat of childJob.build.materials) {
                        priceIDRequest.add(mat.typeID);
                      }
                    }

                    changeLoadingText("Importing Missing Pricing Data...");
                    let returnPricePromiseArray = await getItemPrices(
                      [...priceIDRequest],
                      parentUser
                    );

                    updateEvePrices((prev) =>
                      prev.concat(returnPricePromiseArray)
                    );
                    setMaterialJobs(returnJobPromiseArray);
                    setImportedJob(newJob);
                    updateSaveReady(true);
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
                    InputProps={{ ...params.InputProps, type: "Search" }}
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
                    return <ChildJobEntry key={job.jobID} job={job} />;
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
                <Grid
                  item
                  xs={6}
                  sx={{ paddingRight: "10px", marginTop: "20px" }}
                >
                  <FormControl className={classes.TextField} fullWidth={true}>
                    <Select
                      variant="standard"
                      size="small"
                      value={groupSelect}
                      onChange={(e) => {
                        updateGroupSelect(e.target.value);
                      }}
                    >
                      <MenuItem value={0}>None</MenuItem>
                      {userWatchlist.groups.map((entry) => {
                        return (
                          <MenuItem key={entry.id} value={entry.id}>
                            {entry.name}
                          </MenuItem>
                        );
                      })}
                    </Select>
                    <FormHelperText variant="standard">
                      Watchlist Group
                    </FormHelperText>
                  </FormControl>
                </Grid>
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
        <Button
          disabled={!saveReady}
          variant="contained"
          size="small"
          onClick={handleSave}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
