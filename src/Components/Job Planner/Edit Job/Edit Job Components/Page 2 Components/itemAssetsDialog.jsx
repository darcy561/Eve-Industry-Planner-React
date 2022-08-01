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
import { useContext, useEffect, useState } from "react";
import { UsersContext } from "../../../../../Context/AuthContext";
import { EveIDsContext } from "../../../../../Context/EveDataContext";
import { useCharAssets } from "../../../../../Hooks/useCharAssets";

export function ItemAssetsDialogue({
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
        updateTempEveIDs(newEveIDs);
        updateAssetList(itemAssetList);
        updateAssetLocations(itemLocations);
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
      <DialogContent>
        {!loadAssets ? (
          <Grid container>
            <Grid item xs={12} align="center">
              <CircularProgress color="primary" />
            </Grid>
          </Grid>
        ) : assetList.length > 0 ? (
          <Grid container>
            {assetLocations.map((entry) => {
              let assetLocationData = tempEveIDs.find(
                (i) => i.id === entry.location_id
              );
              if (assetLocationData === undefined) {
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
                      {assetLocationData !== undefined
                        ? assetLocationData.name
                        : "Unknown Location"}
                    </Typography>
                  </Grid>
                  {entry.itemIDs.map((item) => {
                    let itemData = assetList.find((i) => item === i.item_id);
                    let assetOwner = users.find(
                      (i) => i.CharacterHash === itemData.CharacterHash
                    );
                    if (itemData === undefined) {
                      return null;
                    }
                    return (
                      <Grid
                        key={item}
                        container
                        item
                        xs={12}
                        sm={6}
                        sx={{ marginBottom: "5px" }}
                      >
                        <Grid item xs={2}>
                          <Tooltip
                            title={assetOwner.CharacterName}
                            arrow
                            placement="bottom"
                          >
                            <Avatar
                              variant="circle"
                              src={`https://images.evetech.net/characters/${assetOwner.CharacterID}/portrait`}
                              sx={{
                                height: { xs: "30px", md: "40px" },
                                width: { xs: "30px", md: "40px" },
                              }}
                            />
                          </Tooltip>
                        </Grid>
                        <Grid
                          item
                          alignItems="center"
                          xs={10}
                          sx={{ paddingLeft: "5px", display: "flex" }}
                        >
                          <Typography
                            sx={{ typography: { xs: "caption", sm: "body2" } }}
                          >
                            {itemData.quantity.toLocaleString()} Units
                            {itemData.location_flag === "Hangar"
                              ? " - Hangar"
                              : itemData.location_flag === "Unlocked"
                              ? " - Container"
                              : " - Other"}
                          </Typography>
                        </Grid>
                      </Grid>
                    );
                  })}
                </Grid>
              );
            })}
          </Grid>
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
