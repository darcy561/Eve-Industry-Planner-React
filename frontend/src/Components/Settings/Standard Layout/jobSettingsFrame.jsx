import {
  Box,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  MenuItem,
  Select,
  Switch,
  TextField,
} from "@mui/material";
import { scheduleDebouncedApplicationSettingsSave } from "../../../Functions/Debounce/userDocumentsPersistSchedule.js";
import MarketLocationSelect from "../../../Styled Components/Select/marketLocation";
import MarketListingSelect from "../../../Styled Components/Select/marketListing";
import useUsersStore from "../../../Zustand/usersStore";
import useAssetLocations from "../../../Hooks/EveEsi/useAssetLocations";
import { locationPickerLabel } from "../../../Functions/Assets/assetPresentation";
import CustomSystemIndexes from "./Job Settings/customSystemIndexes";
import CustomExtrasFrame from "./Job Settings/customExtrasFrame";

function JobSettingsFrame() {
  const {
    defaultMarketLocation: defaultMarket,
    defaultOrderType: defaultOrders,
    defaultStationIDForAssets: defaultAssetLocation,
    hideCompleteMaterials,
    defaultCitadelBrokersFee: citadelBrokersFee,
  } = useUsersStore((state) => state.applicationSettings);

  const {
    updateDefaultMarket,
    updateDefaultOrders,
    updateDefaultAssetLocation,
    toggleHideCompleteMaterials,
    updateCitadelBrokersFee,
  } = useUsersStore((state) => state.applicationSettings.actions);

  const {
    locations,
    isLoading: locationsLoading,
    isError: locationsError,
  } = useAssetLocations();

  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <Grid container>
        <Grid
          align="center"
          sx={{ paddingX: "20px" }}
          size={{
            xs: 12,
            sm: 6,
          }}
        >
          <MarketLocationSelect
            value={defaultMarket}
            onChange={(e) => {
              updateDefaultMarket(e.id);
              scheduleDebouncedApplicationSettingsSave();
            }}
            labelText="Default Market Hub"
          />
        </Grid>
        <Grid
          align="center"
          sx={{ paddingX: "20px" }}
          size={{
            xs: 12,
            sm: 6,
          }}
        >
          <MarketListingSelect
            value={defaultOrders}
            onChange={(e) => {
              updateDefaultOrders(e.id);
              scheduleDebouncedApplicationSettingsSave();
            }}
            labelText="Default Market Orders"
          />
        </Grid>
        <Grid
          align="center"
          size={{
            xs: 12,
            sm: 6,
          }}
        >
          <FormControlLabel
            label={"Hide Complete Materials"}
            labelPlacement="start"
            control={
              <Switch
                checked={hideCompleteMaterials}
                color="primary"
                onChange={() => {
                  toggleHideCompleteMaterials();
                  scheduleDebouncedApplicationSettingsSave();
                }}
              />
            }
          />
        </Grid>
        <Grid
          align="center"
          sx={{ paddingX: "20px" }}
          size={{
            xs: 12,
            sm: 6,
          }}
        >
          <FormControl fullWidth>
            <Select
              value={
                locations.some(
                  ({ locationId }) => locationId === defaultAssetLocation,
                )
                  ? defaultAssetLocation
                  : ""
              }
              variant="standard"
              displayEmpty
              disabled={locations.length === 0}
              renderValue={(locationId) =>
                locationId
                  ? (locations.find((l) => l.locationId === locationId)?.name ??
                    "")
                  : locationPickerLabel({
                      count: locations.length,
                      isLoading: locationsLoading,
                      isError: locationsError,
                    })
              }
              onChange={(e) => {
                if (!e.target.value) return;
                updateDefaultAssetLocation(e.target.value);
                scheduleDebouncedApplicationSettingsSave();
              }}
            >
              {locations.map(({ locationId, name }) => (
                <MenuItem key={locationId} value={locationId}>
                  {name}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText variant="standard">
              Default Asset Location
            </FormHelperText>
          </FormControl>
        </Grid>
        <Grid
          align="center"
          sx={{ paddingX: "20px" }}
          size={{
            xs: 12,
            sm: 6,
          }}
        >
          <TextField
            fullWidth
            defaultValue={citadelBrokersFee}
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
              updateCitadelBrokersFee(
                Math.round((Number(e.target.value) + Number.EPSILON) * 100) /
                  100,
              );
              scheduleDebouncedApplicationSettingsSave();
            }}
          />
        </Grid>
      </Grid>
      <CustomSystemIndexes />
      <CustomExtrasFrame />
    </Box>
  );
}

export default JobSettingsFrame;
