import {
  Avatar,
  Badge,
  CircularProgress,
  Grid,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useContext } from "react";
import { UsersContext } from "../../Context/AuthContext";
import fullItemNames from "../../RawData/fullItemList.json";
import { useAssetHelperHooks } from "../../Hooks/AssetHooks/useAssetHelper";

export function AssetType({ displayedAssets, fullAssetList, pageLoad }) {
  const { users } = useContext(UsersContext);
  const { formatLocation } = useAssetHelperHooks();
  if (pageLoad) {
    return (
      <Grid container item xs={12} spacing={2}>
        {displayedAssets.map((assetType) => {
          let { name } = fullItemNames.find(
            (i) => i.type_id === assetType.type_id
          ) || {};
          if (!name) return null;

          return (
            <Grid key={assetType.type_id} container item xs={12} sm={6}>
              <Paper
                square={true}
                elevation={2}
                sx={{ width: "100%", padding: "20px" }}
              >
                <Grid container>
                  <Grid item xs={12} sx={{ marginBottom: "20px" }}>
                    <Typography
                      color="primary"
                      sx={{ typography: { xs: "h6", sm: "h5" } }}
                    >
                      {name}
                    </Typography>
                  </Grid>
                  <Grid container item xs={12}>
                    {assetType.itemIDs.map((item) => {
                      const asset = fullAssetList.find(
                        (i) => item === i.item_id
                      );
                      if (!asset) return null;
                      const {
                        CharacterHash,
                        location_flag,
                        quantity,
                        type_id,
                      } = asset;
                      const user = users.find(
                        (i) => i.CharacterHash === CharacterHash
                      );
                      if (!user) return null;
                      const { CharacterName, CharacterID } = user;
                      const locationFlag = formatLocation(location_flag);
                      if (!locationFlag) return null;
                      return (
                        <Tooltip
                          key={item}
                          title={CharacterName}
                          arrow
                          placement="top"
                        >
                          <Grid container item xs={3}>
                            <Grid item xs={12} align="center">
                              <Badge
                                overlap="circular"
                                anchorOrigin={{
                                  vertical: "top",
                                  horizontal: "right",
                                }}
                                badgeContent={
                                  <Avatar
                                    src={`https://images.evetech.net/characters/${CharacterID}/portrait`}
                                    variant="circular"
                                    sx={{
                                      height: {
                                        xs: "24px",
                                        md: "24px",
                                        lg: "32px",
                                      },
                                      width: {
                                        xs: "24px",
                                        md: "24px",
                                        lg: "32px",
                                      },
                                    }}
                                  />
                                }
                              >
                                <picture>
                                  <img
                                    src={`https://images.evetech.net/types/${type_id}/icon/?size=64`}
                                    alt=""
                                    loading="lazy"
                                  />
                                </picture>
                              </Badge>
                            </Grid>
                            <Grid item xs={12} align="center">
                              <Typography
                                sx={{
                                  typography: { xs: "caption", sm: "body2" },
                                }}
                              >
                                {quantity.toLocaleString()}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} align="center">
                              <Typography
                                sx={{
                                  typography: { xs: "caption", sm: "body2" },
                                }}
                              >
                                {locationFlag}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Tooltip>
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
  } else {
    return (
      <Grid>
        <CircularProgress color="primary" />
      </Grid>
    );
  }
}
