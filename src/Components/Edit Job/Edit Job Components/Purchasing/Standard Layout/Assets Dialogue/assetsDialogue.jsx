import {
  Avatar,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Tooltip,
  Typography,
} from "@mui/material";
import { useContext, useEffect, useMemo, useState } from "react";
import { UsersContext } from "../../../../../../Context/AuthContext";
import { EveIDsContext } from "../../../../../../Context/EveDataContext";
import { useCharAssets } from "../../../../../../Hooks/useCharAssets";
import { useAssetHelperHooks } from "../../../../../../Hooks/AssetHooks/useAssetHelper";

export function AssetDialogue({
  material,
  itemAssetsDialogTrigger,
  updateItemAssetsDialogTrigger,
}) {
  const { users } = useContext(UsersContext);
  const { eveIDs, updateEveIDs } = useContext(EveIDsContext);
  const { findItemAssets } = useCharAssets();
  const [loadAssets, setLoadAssets] = useState(false);
  const [assetList, updateAssetList] = useState([]);
  const [assetLocations, updateAssetLocations] = useState([]);
  const [tempEveIDs, updateTempEveIDs] = useState(eveIDs);
  const [defaultLocationAssets, updateDefaultLocationAssets] = useState([]);
  const { formatLocation } = useAssetHelperHooks();
  const parentUser = useMemo(() => {
    return users.find((i) => i.ParentUser);
  }, [users]);

  const handleClose = () => {
    updateEveIDs(tempEveIDs);
    updateItemAssetsDialogTrigger(false);
  };

  useEffect(() => {
    async function buildAssetList() {
      if (itemAssetsDialogTrigger) {
        let [itemAssetList, newEveIDs, itemLocations] = await findItemAssets(
          material.typeID
        );
        let defaultAssets = itemLocations.find(
          (asset) =>
            asset.location_id ===
            parentUser.settings.editJob.defaultAssetLocation
        );
        updateTempEveIDs(newEveIDs);
        updateAssetList(itemAssetList);
        updateAssetLocations(itemLocations);
        if (defaultAssets !== undefined) {
          updateDefaultLocationAssets([defaultAssets]);
        }
        setLoadAssets(true);
      }
    }
    buildAssetList();
  }, [itemAssetsDialogTrigger]);

  return (
    <Dialog
      open={itemAssetsDialogTrigger}
      onClose={handleClose}
      sx={{ paddig: "20px", width: "100%" }}
    >
      <DialogTitle color="primary" align="center">
        {material.name} Assets
      </DialogTitle>
      <DialogContent sx={{ marginTop: "10px" }}>
        {!loadAssets ? (
          <Grid item xs={12} align="center">
            <CircularProgress color="primary" />
          </Grid>
        ) : assetList.length > 0 ? (
          <>
            {defaultLocationAssets.map((asset) => {
              let assetLocationData = tempEveIDs.find(
                (i) => i.id === asset.location_id
              );
              if (!assetLocationData) return null;

              return (
                <Grid
                  key={asset.location_id}
                  container
                  item
                  xs={12}
                  sx={{
                    paddingBottom: "20px",
                    marginBottom: "20px",
                    borderBottom: "1px solid",
                  }}
                >
                  <Grid item xs={12} sx={{ marginBottom: "20px" }}>
                    <Typography
                      align="center"
                      sx={{ typography: { xs: "body2", sm: "body1" } }}
                    >
                      {assetLocationData
                        ? assetLocationData.name
                        : "Unknown Location"}
                    </Typography>
                  </Grid>
                  {asset.itemIDs.map((item) => {
                    const asset = assetList.find((i) => item === i.item_id);
                    if (!asset) return null;
                    const { CharacterHash, location_flag, quantity } = asset;
                    const user = users.find(
                      (i) => i.CharacterHash === CharacterHash
                    );
                    if (!user) return null;
                    const { CharacterName, CharacterID } = user;
                    const locationFlag = formatLocation(location_flag);
                    if (!locationFlag) return null;
                    return (
                      <Grid
                        key={item.item_id}
                        container
                        item
                        xs={12}
                        sm={6}
                        sx={{ marginBottom: "5px" }}
                      >
                        <Grid item xs={2} sm={3} align="center">
                          <Tooltip
                            title={CharacterName}
                            arrow
                            placement="bottom"
                          >
                            <Avatar
                              variant="circle"
                              src={`https://images.evetech.net/characters/${CharacterID}/portrait`}
                              sx={{
                                height: { xs: "30px", md: "35px" },
                                width: { xs: "30px", md: "35px" },
                              }}
                            />
                          </Tooltip>
                        </Grid>
                        <Grid
                          item
                          alignItems="center"
                          xs={10}
                          sm={9}
                          sx={{ paddingLeft: "5px", display: "flex" }}
                        >
                          <Typography
                            sx={{
                              typography: { xs: "caption", sm: "body2" },
                            }}
                          >
                            {quantity.toLocaleString()} Units - {locationFlag}
                          </Typography>
                        </Grid>
                      </Grid>
                    );
                  })}
                </Grid>
              );
            })}
            <Grid container>
              {assetLocations.map((entry) => {
                let assetLocationData = tempEveIDs.find(
                  (i) => i.id === entry.location_id
                );

                if (
                  !assetLocationData ||
                  entry.location_id ===
                    parentUser.settings.editJob.defaultAssetLocation
                ) {
                  return null;
                }
                return (
                  <Grid
                    key={entry.location_id}
                    container
                    item
                    xs={12}
                    sx={{ marginBottom: "20px" }}
                  >
                    <Grid item xs={12} sx={{ marginBottom: "20px" }}>
                      <Typography
                        align="center"
                        sx={{ typography: { xs: "body2", sm: "body1" } }}
                      >
                        {assetLocationData
                          ? assetLocationData.name
                          : "Unknown Location"}
                      </Typography>
                    </Grid>
                    {entry.itemIDs.map((item) => {
                      const asset = assetList.find((i) => item === i.item_id);
                      if (!asset) return null;
                      const { CharacterHash, location_flag, quantity } = asset;
                      const user = users.find(
                        (i) => i.CharacterHash === CharacterHash
                      );
                      if (!user) return null;
                      const { CharacterName, CharacterID } = user;
                      const locationFlag = formatLocation(location_flag);
                      if (!locationFlag) return null;
                      return (
                        <Grid
                          key={item}
                          container
                          item
                          xs={12}
                          sm={6}
                          sx={{ marginBottom: "5px" }}
                        >
                          <Grid item xs={2} sm={3} align="center">
                            <Tooltip
                              title={CharacterName}
                              arrow
                              placement="bottom"
                            >
                              <Avatar
                                variant="circle"
                                src={`https://images.evetech.net/characters/${CharacterID}/portrait`}
                                sx={{
                                  height: { xs: "30px", md: "35px" },
                                  width: { xs: "30px", md: "35px" },
                                }}
                              />
                            </Tooltip>
                          </Grid>
                          <Grid
                            item
                            alignItems="center"
                            xs={10}
                            sm={9}
                            sx={{ paddingLeft: "5px", display: "flex" }}
                          >
                            <Typography
                              sx={{
                                typography: { xs: "caption", sm: "body2" },
                              }}
                            >
                              {quantity.toLocaleString()} Units - {locationFlag}
                            </Typography>
                          </Grid>
                        </Grid>
                      );
                    })}
                  </Grid>
                );
              })}
            </Grid>
          </>
        ) : (
          <Grid container>
            <Grid item xs={12}>
              <Typography
                align="center"
                sx={{ typography: { xs: "caption", sm: "body2" } }}
              >
                No matching items found.
              </Typography>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          size="small"
          color="primary"
          onClick={handleClose}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
