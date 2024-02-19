import {
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  Grid,
  MenuItem,
  Paper,
  Select,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { UsersContext } from "../../../../Context/AuthContext";
import { listingType } from "../../../../Context/defaultValues";
import { useCharAssets } from "../../../../Hooks/useCharAssets";
import { EveIDsContext } from "../../../../Context/EveDataContext";
import { useFirebase } from "../../../../Hooks/useFirebase";
import GLOBAL_CONFIG from "../../../../global-config-app";
import { useHelperFunction } from "../../../../Hooks/GeneralHooks/useHelperFunctions";

export function CompactEditJobSettings({ parentUserIndex }) {
  const { users, updateUsers } = useContext(UsersContext);
  const { updateEveIDs } = useContext(EveIDsContext);
  const { getAssetLocationList } = useCharAssets();
  const { updateMainUserDoc } = useFirebase();
  const [marketSelect, updateMarketSelect] = useState(
    users[parentUserIndex].settings.editJob.defaultMarket
  );
  const [listingSelect, updateListingSelect] = useState(
    users[parentUserIndex].settings.editJob.defaultOrders
  );
  const [dataLoading, updateDataLoading] = useState(true);
  const [assetLocationSelect, updateAssetLocationSelect] = useState(
    users[parentUserIndex].settings.editJob.defaultAssetLocation
  );
  const [assetLocationEntries, updateAssetLocationEntries] = useState([]);
  const { findUniverseItemObject } = useHelperFunction();
  const { MARKET_OPTIONS } = GLOBAL_CONFIG;

  useEffect(() => {
    async function getAsset() {
      updateDataLoading(true);
      const { itemLocations, newEveIDs  } = await getAssetLocationList();
      updateAssetLocationEntries(itemLocations);
      updateEveIDs((prev) => ({ ...prev, ...newEveIDs }));
      updateDataLoading((prev) => !prev);
    }
    getAsset();
  }, [users]);

  return (
    <Paper elevation={3} sx={{ padding: "20px" }} square={true}>
      <Grid container>
        <Grid item xs={12} align="center" sx={{ marginBottom: "20px" }}>
          <Typography variant="h6" color="primary">
            Edit Job Settings
          </Typography>
        </Grid>
        <Grid container item xs={12}>
          <Grid item xs={6} sm={4} lg={3}>
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
              fullWidth={true}
            >
              <Select
                value={marketSelect}
                variant="standard"
                size="small"
                onChange={(e) => {
                  let newUsersArray = [...users];
                  newUsersArray[
                    parentUserIndex
                  ].settings.editJob.defaultMarket = e.target.value;
                  updateMarketSelect(e.target.value);
                  updateUsers(newUsersArray);
                  updateMainUserDoc();
                }}
                sx={{
                  width: "90px",
                }}
              >
                {MARKET_OPTIONS.map((option) => {
                  return (
                    <MenuItem key={option.name} value={option.id}>
                      {option.name}
                    </MenuItem>
                  );
                })}
              </Select>
              <FormHelperText variant="standard">
                Default Market Hub
              </FormHelperText>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={4} lg={3}>
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
              fullWidth={true}
            >
              <Select
                value={listingSelect}
                variant="standard"
                size="small"
                onChange={(e) => {
                  let newUsersArray = [...users];
                  newUsersArray[
                    parentUserIndex
                  ].settings.editJob.defaultOrders = e.target.value;
                  updateListingSelect(e.target.value);
                  updateUsers(newUsersArray);
                  updateMainUserDoc();
                }}
                sx={{
                  width: "120px",
                }}
              >
                {listingType.map((option) => {
                  return (
                    <MenuItem key={option.name} value={option.id}>
                      {option.name}
                    </MenuItem>
                  );
                })}
              </Select>
              <FormHelperText variant="standard">
                Default Market Listings
              </FormHelperText>
            </FormControl>
          </Grid>
          <Grid
            item
            xs={12}
            sm={4}
            lg={6}
            sx={{ marginTop: { xs: "20px", sm: "0px" } }}
          >
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      users[parentUserIndex].settings.editJob
                        .hideCompleteMaterials
                    }
                    color="primary"
                    onChange={(e) => {
                      let newUsersArray = [...users];
                      newUsersArray[
                        parentUserIndex
                      ].settings.editJob.hideCompleteMaterials =
                        e.target.checked;
                      updateUsers(newUsersArray);
                      updateMainUserDoc();
                    }}
                  />
                }
                label={
                  <Typography
                    sx={{ typography: { xs: "caption", sm: "body2" } }}
                  >
                    Hide Complete Materials
                  </Typography>
                }
                labelPlacement="bottom"
              />
            </FormGroup>
          </Grid>
          <Grid
            item
            xs={12}
            sm={6}
            align="center"
            sx={{ marginTop: { xs: "20px", sm: "10px" } }}
          >
            {dataLoading ? (
              <CircularProgress color="primary" size="20px" />
            ) : (
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
                  value={assetLocationSelect}
                  variant="standard"
                  size="small"
                  onChange={(e) => {
                    let newUsersArray = [...users];
                    newUsersArray[
                      parentUserIndex
                    ].settings.editJob.defaultAssetLocation = e.target.value;
                    updateAssetLocationSelect(e.target.value);
                    updateUsers(newUsersArray);
                    updateMainUserDoc();
                  }}
                >
                  {assetLocationEntries.map((entry) => {
                    let locationNameData = findUniverseItemObject(entry);

                    if (
                      locationNameData === undefined ||
                      locationNameData.name === "No Access To Location"
                    ) {
                      return null;
                    }
                    return (
                      <MenuItem key={entry} value={entry}>
                        {locationNameData.name}
                      </MenuItem>
                    );
                  })}
                </Select>
                <FormHelperText variant="standard">
                  Default Asset Location
                </FormHelperText>
              </FormControl>
            )}
          </Grid>
          <Grid
            item
            xs={12}
            sm={6}
            align="center"
            sx={{ marginTop: { xs: "20px", sm: "10px" } }}
          >
            <TextField
              defaultValue={
                users[parentUserIndex].settings.editJob.citadelBrokersFee
              }
              size="small"
              variant="standard"
              sx={{
                "& .MuiFormHelperText-root": {
                  color: (theme) => theme.palette.secondary.main,
                },
                "& input::-webkit-clear-button, & input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
                  {
                    display: "none",
                  },
              }}
              helperText="Citadel Brokers Fee Percentage"
              type="number"
              onBlur={(e) => {
                let newUsersArray = [...users];
                newUsersArray[
                  parentUserIndex
                ].settings.editJob.citadelBrokersFee =
                  Math.round((Number(e.target.value) + Number.EPSILON) * 100) /
                  100;
                updateUsers(newUsersArray);
                updateMainUserDoc();
              }}
            />
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
}
