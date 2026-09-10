import { FormControl, FormHelperText, MenuItem, Select } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  appShellHelperTextSx,
  appShellOutlinedFormControl,
  getAppShellSelectMenuProps,
} from "../../../Context/appShell";
import { locationPickerLabel } from "../../../Functions/Assets/assetPresentation";

/**
 * Default asset location dropdown with the same outlined look as other first-login selects.
 */
export function FirstLoginAssetLocationSelect({
  value,
  locations,
  onChange,
  isLoading = false,
  isError = false,
  labelText = "Default Asset Location",
}) {
  const theme = useTheme();

  return (
    <FormControl
      fullWidth
      sx={(t) => ({
        ...appShellOutlinedFormControl(t),
        "& .MuiFormHelperText-root": appShellHelperTextSx,
      })}
    >
      <Select
        variant="outlined"
        size="small"
        displayEmpty
        value={
          locations.some(({ locationId }) => locationId === value) ? value : ""
        }
        disabled={locations.length === 0}
        onChange={(e) => {
          if (!e.target.value) return;
          onChange(e.target.value);
        }}
        MenuProps={getAppShellSelectMenuProps(theme)}
      >
        <MenuItem value="">
          <em>
            {locationPickerLabel({
              count: locations.length,
              isLoading,
              isError,
            })}
          </em>
        </MenuItem>
        {locations.map(({ locationId, name }) => (
          <MenuItem key={locationId} value={locationId}>
            {name}
          </MenuItem>
        ))}
      </Select>
      <FormHelperText variant="standard" sx={appShellHelperTextSx}>
        {labelText}
      </FormHelperText>
    </FormControl>
  );
}
