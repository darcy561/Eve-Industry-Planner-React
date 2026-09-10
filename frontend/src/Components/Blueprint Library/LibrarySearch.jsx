import { Box, Chip, FormControl, MenuItem, Select } from "@mui/material";
import { useCachedData } from "../../Hooks/App/useCachedData";
import { CACHED_DATA_FILES } from "../../Context/defaultValues";
import VirtualisedRecipeSearch from "../../Styled Components/autocomplete/virtualisedRecipeSearch";
import { useNavigate, useSearch } from "@tanstack/react-router";

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "reactions", label: "Reactions" },
  { value: "bpo", label: "BP Originals" },
  { value: "bpc", label: "BP Copies" },
];

/**
 * The controls above the library: what to look for, which kinds to show, and where they are held.
 *
 * @param {{places: Array<{locationId: number, name: string}>}} props
 */
export function LibrarySearch({ places = [] }) {
  const { data: itemList } = useCachedData(CACHED_DATA_FILES.SEARCH_INDEX);
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) || {};

  const currentFilter = search?.filter || "all";
  const currentLocation = search?.location ?? "";

  function handleFilterChange(newFilter) {
    navigate({
      search: (prev) => ({
        ...prev,
        filter: newFilter,
        page: 1, // Reset to first page when filter changes
        search: undefined, // Clear search when filter changes
      }),
    });
  }

  function handleSearchSelect(value) {
    if (!itemList || !value) return;

    // Update URL to reflect search - parent component will handle filtering
    navigate({
      search: (prev) => ({
        ...prev,
        search: value.blueprintID.toString(),
        filter: "all", // Reset filter when searching
        page: 1,
      }),
    });
  }

  function handleLocationChange(locationId) {
    navigate({
      search: (prev) => ({
        ...prev,
        location: locationId || undefined,
        page: 1,
      }),
    });
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <VirtualisedRecipeSearch onSelect={handleSearchSelect} />
      <Box
        sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}
      >
        {FILTER_OPTIONS.map(({ value, label }) => (
          <Chip
            key={value}
            label={label}
            color={currentFilter === value ? "primary" : "default"}
            variant={currentFilter === value ? "filled" : "outlined"}
            onClick={() => handleFilterChange(value)}
          />
        ))}
        <FormControl size="small" sx={{ minWidth: 200, marginLeft: "auto" }}>
          <Select
            value={
              places.some(
                (p) => String(p.locationId) === String(currentLocation),
              )
                ? currentLocation
                : ""
            }
            size="small"
            displayEmpty
            disabled={places.length === 0}
            onChange={(event) => handleLocationChange(event.target.value)}
          >
            <MenuItem value="">
              <em>Anywhere</em>
            </MenuItem>
            {places.map(({ locationId, name }) => (
              <MenuItem key={locationId} value={locationId}>
                {name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Box>
  );
}
