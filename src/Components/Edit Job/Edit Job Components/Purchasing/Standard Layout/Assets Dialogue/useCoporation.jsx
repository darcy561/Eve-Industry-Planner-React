import { FormControlLabel, FormGroup, Switch } from "@mui/material";
import { useContext } from "react";
import { CorpEsiDataContext } from "../../../../../../Context/EveDataContext";

export function UseCorporationSelector_AssetsDialog({
  useCorporationAssets,
  setUseCorporationAssets,
  parentUser,
  setSelectedAsset,
}) {
  const { corpEsiData } = useContext(CorpEsiDataContext);

  return (
    <FormGroup sx={{marginRight: "10px"}}> 
      <FormControlLabel
        label="Use Corporation Assets"
        labelPlacement="start"
        control={
          <Switch
            checked={useCorporationAssets}
            size="small"
            onChange={() => {
              if (useCorporationAssets) {
                setSelectedAsset(parentUser.CharacterHash);
              } else {
                setSelectedAsset(
                  Array.from(corpEsiData.values())[0]?.corporation_id
                );
              }
              setUseCorporationAssets((prev) => !prev);
            }}
          />
        }
      />
    </FormGroup>
  );
}
