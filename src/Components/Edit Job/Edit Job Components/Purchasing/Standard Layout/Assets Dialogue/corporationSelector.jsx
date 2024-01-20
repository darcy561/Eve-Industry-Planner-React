import { useContext } from "react";
import { CorpEsiDataContext } from "../../../../../../Context/EveDataContext";
import { MenuItem, Select } from "@mui/material";

export function CorporationSelector_AssetDialog({
  useCorporationAssets,
  selectedAsset,
  setSelectedAsset,
}) {
    const { corpEsiData } = useContext(CorpEsiDataContext);

  if (!useCorporationAssets) return null;

  return (
    <Select
      value={selectedAsset}
      size="small"
      onChange={(e) => {
        setSelectedAsset(e.target.value);
      }}
    >
      {Array.from(corpEsiData).map(([corpID, {name}]) => {

        return (
          <MenuItem key={corpID} value={corpID}>
            {name}
          </MenuItem>
        )
      })}
    </Select>   
  );
}
