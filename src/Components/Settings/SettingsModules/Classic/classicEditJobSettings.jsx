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
import {
  blueprintOptions,
  listingType,
} from "../../../../Context/defaultValues";
import { useCharAssets } from "../../../../Hooks/useCharAssets";
import { EveIDsContext } from "../../../../Context/EveDataContext";
import { useFirebase } from "../../../../Hooks/useFirebase";
import GLOBAL_CONFIG from "../../../../global-config-app";
import { useHelperFunction } from "../../../../Hooks/GeneralHooks/useHelperFunctions";
import uuid from "react-uuid";
import { ApplicationSettingsContext } from "../../../../Context/LayoutContext";

export function ClassicEditJobSettings({ parentUserIndex }) {
  const { users } = useContext(UsersContext);
  const { applicationSettings, updateApplicationSettings } = useContext(
    ApplicationSettingsContext
  );
  const { updateEveIDs } = useContext(EveIDsContext);
  const { getAssetLocationList } = useCharAssets();
  const { uploadApplicationSettings } = useFirebase();
  const [marketSelect, updateMarketSelect] = useState(
    applicationSettings.defaultMarket
  );
  const [listingSelect, updateListingSelect] = useState(
    applicationSettings.defaultOrders
  );
  const [dataLoading, updateDataLoading] = useState(true);
  const [assetLocationSelect, updateAssetLocationSelect] = useState(
    applicationSettings.defaultAssetLocation
  );
  const [assetLocationEntries, updateAssetLocationEntries] = useState([]);
  const [defaultMaterialEfficiency, updateDefaultMaterialEfficiency] = useState(
    applicationSettings.defaultMaterialEfficiencyValue
  );
  const { findUniverseItemObject } = useHelperFunction();
  const { MARKET_OPTIONS } = GLOBAL_CONFIG;

  useEffect(() => {
    async function getAsset() {
      updateDataLoading(true);
      const { itemLocations, newEveIDs } = await getAssetLocationList();
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
            <FormControl fullWidth>
              <Select
                value={marketSelect}
                variant="standard"
                size="small"
                onChange={(e) => {
                  if (!e.target.value) return;
                  const newApplicationSettings =
                    applicationSettings.updateDefaultMarket(e.target.value);
                  updateMarketSelect(e.target.value);
                  updateApplicationSettings(newApplicationSettings);
                  uploadApplicationSettings(newApplicationSettings);
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
            <FormControl fullWidth>
              <Select
                value={listingSelect}
                variant="standard"
                size="small"
                onChange={(e) => {
                  if (!e.target.value) return;
                  const newApplicationSettings =
                    applicationSettings.updateDefaultOrders(e.target.value);
                  updateListingSelect(e.target.value);
                  updateApplicationSettings(newApplicationSettings);
                  uploadApplicationSettings(newApplicationSettings);
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
                    checked={applicationSettings.hideCompleteMaterials}
                    color="primary"
                    onChange={(e) => {
                      const newApplicationSettings =
                        applicationSettings.toggleHideCompleteMaterials();

                      updateApplicationSettings(newApplicationSettings);
                      uploadApplicationSettings(newApplicationSettings);
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
              <FormControl fullWidth>
                <Select
                  value={assetLocationSelect}
                  variant="standard"
                  size="small"
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const newApplicationSettings =
                      applicationSettings.updateDefaultAssetLocation(
                        e.target.value
                      );
                    updateAssetLocationSelect(e.target.value);
                    updateApplicationSettings(newApplicationSettings);
                    uploadApplicationSettings(newApplicationSettings);
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
              defaultValue={applicationSettings.citadelBrokersFee}
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
                if (!e.target.value) return;
                const newApplicationSettings =
                  applicationSettings.updateCitadelBrokersFee(
                    Math.round(
                      (Number(e.target.value) + Number.EPSILON) * 100
                    ) / 100
                  );
                updateApplicationSettings(newApplicationSettings);
                uploadApplicationSettings(newApplicationSettings);
              }}
            />
          </Grid>
          <Grid
            item
            xs={12}
            sm={6}
            align="center"
            sx={{ marginTop: { xs: "20px", sm: "10px" } }}
          >
            <FormControl fullWidth>
              <Select
                value={defaultMaterialEfficiency}
                variant="standard"
                size="small"
                onChange={(e) => {
                  if (!e.target.value) return;
                  const newApplicationSettings =
                    applicationSettings.updateDefaultMaterialEfficiencyValue(
                      e.target.value
                    );
                  updateDefaultMaterialEfficiency(e.target.value);
                  updateApplicationSettings(newApplicationSettings);
                  uploadApplicationSettings(newApplicationSettings);
                }}
              >
                {blueprintOptions.me.map((i) => {
                  return (
                    <MenuItem key={uuid()} value={i.value}>
                      {i.label}
                    </MenuItem>
                  );
                })}
              </Select>
              <FormHelperText variant="standard">
                Default Material Efficiency Value
              </FormHelperText>
            </FormControl>
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
}
