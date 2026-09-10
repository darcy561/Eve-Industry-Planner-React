import { useMemo, useRef } from "react";
import Autocomplete, {
  createFilterOptions,
} from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { FormControl, useTheme } from "@mui/material";

import {
  appShellAutocompleteListboxSx,
  appShellOutlinedFormControl,
  appShellSelectMenuPaperSx,
  appShellTextFieldOutlinedSx,
} from "../../Context/appShell";
import { locationPickerLabel } from "../../Functions/Assets/assetPresentation";
import VirtualisedListbox from "./virtualisedListbox";

const filterLocations = createFilterOptions({
  stringify: (option) => option.name ?? "",
});

/**
 * Picks one of the places an account holds things.
 *
 * An autocomplete rather than a dropdown: an account that has been played for a while holds things
 * at hundreds of stations and structures, which is a list to search rather than one to scroll.
 *
 * @param {{
 *   places: Array<{locationId: number, name: string}>,
 *   value: number|string|undefined,
 *   onChange: (locationId: number|undefined) => void,
 *   isLoading?: boolean,
 *   isError?: boolean,
 *   anywhereLabel?: string,
 *   label?: string
 * }} props - `anywhereLabel` names the entry that clears the choice; omit it to require one
 */
export default function VirtualisedLocationSearch({
  places = [],
  value,
  onChange,
  isLoading = false,
  isError = false,
  anywhereLabel,
  label = "Location",
}) {
  const theme = useTheme();
  const virtualizerControlRef = useRef(null);

  const options = useMemo(
    () =>
      anywhereLabel
        ? [{ locationId: "", name: anywhereLabel }, ...places]
        : places,
    [places, anywhereLabel]
  );

  const selected = useMemo(
    () =>
      options.find(
        (place) => String(place.locationId) === String(value ?? "")
      ) ?? null,
    [options, value]
  );

  return (
    <FormControl
      fullWidth
      size="small"
      sx={(t) => ({ ...appShellOutlinedFormControl(t) })}
    >
      <Autocomplete
        size="small"
        options={options}
        value={selected}
        disabled={places.length === 0}
        filterOptions={filterLocations}
        getOptionLabel={(option) => option.name ?? ""}
        isOptionEqualToValue={(option, chosen) =>
          String(option.locationId) === String(chosen.locationId)
        }
        onChange={(event, chosen) => onChange(chosen?.locationId || undefined)}
        slotProps={{
          listbox: {
            component: VirtualisedListbox,
            virtualizerControlRef,
            sx: appShellAutocompleteListboxSx(theme),
          },
          paper: { sx: appShellSelectMenuPaperSx(theme) },
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            placeholder={locationPickerLabel({
              count: places.length,
              isLoading,
              isError,
            })}
            sx={appShellTextFieldOutlinedSx(theme)}
          />
        )}
      />
    </FormControl>
  );
}
