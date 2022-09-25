import { Avatar, Badge, Grid, Paper, Typography } from "@mui/material";
import React, { useContext } from "react";
import { UsersContext } from "../../Context/AuthContext";
import fullItemNames from "../../RawData/fullItemList.json";
import searchData from "../../RawData/searchIndex.json";

export function AssetType({ locationAsset, fullAssetList }) {
  const { users } = useContext(UsersContext);
  return (
    <Grid container item xs={12} spacing={2}>
      {locationAsset.map((assetType) => {
        let assetData = fullItemNames.find(
          (i) => i.type_id === assetType.type_id
        );
        if (assetData === undefined) {
          return null;
        }
        return (
          <Grid key={assetType.type_id} container item xs={12} sm={6}>
            <Paper
              square={true}
              elevation={2}
              sx={{ width: "100%", padding: "20px" }}
            >
              <Grid container>
                <Grid item xs={12}>
                  <Typography
                    color="primary"
                    sx={{ typography: { xs: "h6", sm: "h5" } }}
                  >
                    {assetData.name}
                  </Typography>
                </Grid>
                <Grid container item xs={12}>
                  {assetType.itemIDs.map((item) => {
                    const itemData = fullAssetList.find(
                      (i) => i.item_id === item
                    );
                    const assetOwner = users.find(
                      (i) => i.CharacterHash === itemData.CharacterHash
                    );
                    return (
                      <Grid key={item} container item xs={4}>
                        <Grid item xs={12}>
                          <Badge
                            overlap="circular"
                            anchorOrigin={{
                              vertical: "top",
                              horizontal: "right",
                            }}
                            badgeContent={
                              <Avatar
                                src={`https://images.evetech.net/characters/${assetOwner.CharacterID}/portrait`}
                                variant="circular"
                                sx={{
                                  height: {
                                    xs: "24px",
                                    md: "24px",
                                    lg: "32px",
                                  },
                                  width: { xs: "24px", md: "24px", lg: "32px" },
                                }}
                              />
                            }
                          >
                            <picture>
                              <img
                                src={`https://images.evetech.net/types/${itemData.type_id}/icon/?size=64`}
                                alt=""
                                loading="lazy"
                              />
                            </picture>
                          </Badge>
                          <Typography>{itemData.quantity}</Typography>
                        </Grid>
                      </Grid>
                    );
                  })}
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        );
      })}
    </Grid>
  );
}
