import { MenuItem, Select } from "@mui/material";
import { useContext } from "react";
import { UsersContext } from "../../../../../../Context/AuthContext";

export function CharacterSelector_AssetDialog({
  useCorporationAssets,
  selectedAsset,
  setSelectedAsset,
}) {
  const { users } = useContext(UsersContext);
  if (useCorporationAssets) return null;

  return (
    <Select
      value={selectedAsset}
      size="small"
      onChange={(e) => {
        setSelectedAsset(e.target.value);
      }}
    >
      {users.map((user) => {
        return (
          <MenuItem key={user.CharacterHash} value={user.CharacterHash}>
            {user.CharacterName}
          </MenuItem>
        );
      })}
    </Select>
  );
}
