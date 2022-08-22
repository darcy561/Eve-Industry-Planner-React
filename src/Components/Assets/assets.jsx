import { Grid } from "@mui/material";
import { useContext, useEffect, useMemo, useState } from "react";
import { UsersContext } from "../../Context/AuthContext";
import { EveIDsContext } from "../../Context/EveDataContext";
import { useCharAssets } from "../../Hooks/useCharAssets";
import { AssetType } from "./assetType";
import { AssetSearch } from "./assetSearch";

export default function AssetLibrary() {
  const { users } = useContext(UsersContext);
  const { updateEveIDs } = useContext(EveIDsContext);
  const { findLocationAssets, getAssetLocationList } = useCharAssets();
  const [locationList, updateLocationList] = useState([]);
  const [locationAsset, updateLocationAssets] = useState([]);
  const [fullAssetList, updateFullAssetList] = useState([]);
  const [pageLoad, updatePageLoad] = useState(false);
  const parentUser = useMemo(() => users.find((i) => i.ParentUser), [users]);
  const [selectedLocation, updateSelectedLocation] = useState(
    parentUser.settings.editJob.defaultAssetLocation
  );

  useEffect(() => {
    const assetLocationFetch = async () => {
      updatePageLoad(false);
      let [assetLocationList, newEveIDs] = await getAssetLocationList();
      let [newFullAssetList, newLocationAssets] = await findLocationAssets(
        selectedLocation
      );
      console.log(newLocationAssets);
      updateFullAssetList(newFullAssetList);
      updateLocationAssets(newLocationAssets);
      updateEveIDs(newEveIDs);
      updateLocationList(assetLocationList);
      updatePageLoad(true);
    };
    assetLocationFetch();
  }, [users, selectedLocation]);

  return (
    <Grid container sx={{ marginTop: "5px" }} spacing={2}>
      <Grid item xs={12}>
        <AssetSearch
          locationList={locationList}
          selectedLocation={selectedLocation}
          updateSelectedLocation={updateSelectedLocation}
          pageLoad={pageLoad}
        />
      </Grid>
      <Grid
        container
        item
        xs={12}
        sx={{ marginLeft: "10px", marginRight: "10px" }}
      >
        <AssetType
          locationAsset={locationAsset}
          fullAssetList={fullAssetList}
        />
      </Grid>
    </Grid>
  );
}
