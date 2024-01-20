import { useContext } from "react";
import { CorpEsiDataContext } from "../../../Context/EveDataContext";
import { MenuItem, Select } from "@mui/material";

export function CorporationSelectDropdown({
  selectedCorporation,
  updateSelectedCorporation,
}) {
  const { corpEsiData } = useContext(CorpEsiDataContext);

  function onSelectionChange(event) {
    updateSelectedCorporation(event.target.value);
  }

  return (
    <Select
      variant="standard"
      size="small"
      value={selectedCorporation}
      onChange={onSelectionChange}
    >
      {[...corpEsiData.values()].map(({ corporation_id, name }) => {
        return (
          <MenuItem key={corporation_id} value={corporation_id}>
            {name}
          </MenuItem>
        );
      })}
    </Select>
  );
}
