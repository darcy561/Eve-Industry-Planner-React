import { Grid, Pagination } from "@mui/material";
import { useContext, useEffect, useMemo, useState } from "react";
import { UsersContext } from "../../Context/AuthContext";
import { EveIDsContext } from "../../Context/EveDataContext";
import { useCharAssets } from "../../Hooks/useCharAssets";
import { AssetType } from "./assetType";
import { AssetSearch } from "./assetSearch";
import itemData from "../../RawData/fullItemList.json";
import { ESIOffline } from "../offlineNotification";

export default function AssetLibrary() {
  const { users } = useContext(UsersContext);
  const { updateEveIDs } = useContext(EveIDsContext);
  const { findLocationAssets, getAssetLocationList } = useCharAssets();
  const [locationList, updateLocationList] = useState([]);
  const [locationAsset, updateLocationAssets] = useState([]);
  const [fullAssetList, updateFullAssetList] = useState([]);
  const [namesLoad, updateNamesLoad] = useState(false);
  const [pageLoad, updatePageLoad] = useState(false);
  const parentUser = useMemo(() => users.find((i) => i.ParentUser), [users]);
  const [selectedLocation, updateSelectedLocation] = useState(
    parentUser.settings.editJob.defaultAssetLocation
  );
  const [pagination, setPagination] = useState({
    count: 0,
    from: 0,
    to: 16,
    pageSize: 16,
  });
  const [displayedAssets, updateDisplayedAssets] = useState([]);

  useEffect(() => {
    const assetLocationFetch = async () => {
      updatePageLoad(false);
      updateNamesLoad(false);
      let [assetLocationList, newEveIDs] = await getAssetLocationList();
      let [newFullAssetList, newLocationAssets] = await findLocationAssets(
        selectedLocation
      );
      newLocationAssets.sort((a, b) => {
        let aName = itemData.find((i) => i.type_id === a.type_id);
        let bName = itemData.find((i) => i.type_id === b.type_id);
        if (aName === undefined || bName === undefined) {
          return 0;
        }
        if (aName.name < bName.name) {
          return -1;
        }
        if (aName.name > bName.name) {
          return 1;
        }
        return 0;
      });

      setPagination((prev) => ({
        ...prev,
        from: 0,
        to: prev.pageSize,
      }));
      updateFullAssetList(newFullAssetList);
      updateLocationAssets(newLocationAssets);
      updateEveIDs(newEveIDs);
      updateLocationList(assetLocationList);
      updatePageLoad(true);
      updateNamesLoad(true);
    };
    assetLocationFetch();
  }, [users, selectedLocation]);

  useEffect(() => {
    updatePageLoad(false);
    let returnedAssets = locationAsset.slice(pagination.from, pagination.to);
    updateDisplayedAssets(returnedAssets);
    updatePageLoad(true);
  }, [locationAsset, pagination.from, pagination.to, pagination.pageSize]);

  const handlePageChange = (event, page) => {
    const from = (page - 1) * pagination.pageSize;
    const to = (page - 1) * pagination.pageSize + pagination.pageSize;
    setPagination((prev) => ({ ...prev, from: from, to: to }));
  };

  return (
    <Grid container sx={{ marginTop: "5px" }} spacing={2}>
      <ESIOffline/>
      <Grid item xs={12} sx={{marginLeft: "10px", marginRight:"10px"}}>
        <AssetSearch
          locationList={locationList}
          selectedLocation={selectedLocation}
          updateSelectedLocation={updateSelectedLocation}
          namesLoad={namesLoad}
          pagination={pagination}
          setPagination={setPagination}
        />
      </Grid>
      <Grid
        container
        item
        xs={12}
        sx={{ marginLeft: "10px", marginRight: "10px" }}
      >
        <AssetType
          displayedAssets={displayedAssets}
          fullAssetList={fullAssetList}
          pageLoad={pageLoad}
        />
      </Grid>
      <Grid
        container
        item
        xs={12}
        justifyContent="center"
        align="center"
        sx={{ marginTop: "40px" }}
      >
        <Pagination
          color="primary"
          size="small"
          count={Math.ceil(locationAsset.length / pagination.pageSize)}
          onChange={handlePageChange}
        />
      </Grid>
    </Grid>
  );
}
