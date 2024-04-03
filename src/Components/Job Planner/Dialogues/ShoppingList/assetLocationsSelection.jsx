import {
  DialogActions,
  FormControl,
  FormHelperText,
  Grid,
  MenuItem,
  Select,
} from "@mui/material";
import { useHelperFunction } from "../../../../Hooks/GeneralHooks/useHelperFunctions";
import { useContext } from "react";
import { UsersContext } from "../../../../Context/AuthContext";

export function SelectAssetLocation_ShoppingListDialog({
  removeAssets,
  assetLocations,
  tempEveIDs,
  selectedLocation,
  updateSelectedLocation,
  selectedCharacter,
  updateSelectedCharacter,
}) {
  const { users } = useContext(UsersContext);
  const { findUniverseItemObject } = useHelperFunction();

  if (!removeAssets) return null;

  return (
    <DialogActions>
      <Grid container>
        <Grid item xs={6}>
          <FormControl
            fullWidth
            sx={{
              "& .MuiFormHelperText-root": {
                color: (theme) => theme.palette.secondary.main,
              },
            }}
          >
            <Select
              value={selectedLocation}
              size="small"
              onChange={(e) => {
                updateSelectedLocation(e.target.value);
              }}
            >
              {assetLocations.map((entry) => {
                const locationNameData = findUniverseItemObject(
                  entry,
                  tempEveIDs
                );

                if (
                  !locationNameData ||
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
            <FormHelperText variat="standard">AssetLocation</FormHelperText>
          </FormControl>
        </Grid>
        <Grid item xs={6}>
          <FormControl
            fullWidth
            sx={{
              "& .MuiFormHelperText-root": {
                color: (theme) => theme.palette.secondary.main,
              },
            }}
          >
            <Select
              value={selectedCharacter}
              size="small"
              onChange={(e) => {
                updateSelectedCharacter(e.target.value);
              }}
            >
              {users.length > 1 && (
                <MenuItem key={"allUsers"} value={"allUsers"}>
                  All
                </MenuItem>
              )}
              {users.map((user) => {
                return (
                  <MenuItem key={user.CharacterHash} value={user.CharacterHash}>
                    {user.CharacterName}
                  </MenuItem>
                );
              })}
            </Select>
            <FormHelperText variant="standard">
              Character Selection
            </FormHelperText>
          </FormControl>
        </Grid>
      </Grid>
    </DialogActions>
  );
}
