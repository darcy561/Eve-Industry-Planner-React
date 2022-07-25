import {
  Avatar,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  Tooltip,
  Typography,
} from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { UsersContext } from "../../../../../Context/AuthContext";
import { EveIDsContext } from "../../../../../Context/EveDataContext";
import { useJobManagement } from "../../../../../Hooks/useJobManagement";

export function ItemAssetsDialogue({
  material,
  itemAssetsDialogTrigger,
  updateItemAssetsDialogTrigger,
}) {
  const { users } = useContext(UsersContext);
  const { eveIDs, updateEveIDs } = useContext(EveIDsContext);
  const { findItemAssets, retrieveAssetLocation } = useJobManagement();
  const [loadAssets, setLoadAssets] = useState(false);
  const [assetList, updateAssetList] = useState([]);
  const [tempEveIDs, updateTempEveIDs] = useState(eveIDs);

  const handleClose = () => {
    updateEveIDs(tempEveIDs);
    updateItemAssetsDialogTrigger(false);
  };

  useEffect(() => {
    async function buildAssetList() {
      if (itemAssetsDialogTrigger) {
        let [itemAssets, newEveIDs] = await findItemAssets(material.typeID);
        updateTempEveIDs(newEveIDs);
        updateAssetList(itemAssets);
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
            {assetList.map((entry) => {
              console.log(entry);
              let assetOwner = users.find(
                (i) => i.CharacterHash === entry.CharacterHash
              );
              let assetLocationData = tempEveIDs.find(
                (i) => i.id === entry.location_id
              );
              if (assetLocationData === undefined) {
                let userAssets = [];
                users.forEach((user) => {
                  userAssets = userAssets.concat(
                    JSON.parse(
                      sessionStorage.getItem(`assets_${user.CharacterHash}`)
                    )
                  );
                });
                let itemLocation = retrieveAssetLocation(entry, userAssets);
                assetLocationData = tempEveIDs.find(
                  (i) => i.id === itemLocation.location_id
                );
              }

              return (
                <Grid container item xs={12} sx={{marginBottom:"20px"}}>
                  <Grid item xs={12} sx={{marginBottom:"20px"}}>
                    <Typography align="center">{assetLocationData.name}</Typography>
                  </Grid>
                      <Grid item xs={1}>
                          <Tooltip title={assetOwner.CharacterName} arrow placement="bottom">
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
                  <Grid item xs={10}>
                    <Typography>
                      {entry.quantity.toLocaleString()}{" "}
                      Units
                      {entry.location_flag === "Hangar"
                        ? " - Hangar"
                        : entry.location_flag === "Unlocked"
                        ? " - Container"
                        : " - Other"}
                    </Typography>
                  </Grid>
                </Grid>
              );
            })}
          </Grid>
        ) : (
          "nope"
        )}
      </DialogContent>
    </Dialog>
  );
}
