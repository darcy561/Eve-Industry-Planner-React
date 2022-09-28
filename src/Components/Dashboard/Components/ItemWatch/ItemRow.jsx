import {
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Tooltip,
  Typography,
} from "@mui/material";
import { useContext, useState } from "react";
import { EvePricesContext } from "../../../../Context/EveDataContext";
import ClearIcon from "@mui/icons-material/Clear";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { UserWatchlistContext } from "../../../../Context/AuthContext";
import { useFirebase } from "../../../../Hooks/useFirebase";
import { SnackBarDataContext } from "../../../../Context/LayoutContext";
import { getAnalytics, logEvent } from "firebase/analytics";

import { makeStyles } from "@mui/styles";

const useStyles = makeStyles((theme) => ({
  Select: {
    "& .MuiFormHelperText-root": {
      color: theme.palette.secondary.main,
    },
    "& input::-webkit-clear-button, & input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
      {
        display: "none",
      },
  },
}));

export function WatchListRow({ item, parentUser, index }) {
  const [expanded, setExpanded] = useState(false);
  const { userWatchlist, updateUserWatchlist } =
    useContext(UserWatchlistContext);
  const { evePrices } = useContext(EvePricesContext);
  const { uploadUserWatchlist } = useFirebase();
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const analytics = getAnalytics();
  const classes = useStyles();

  const handleRemove = async () => {
    let newUserWatchlistItems = [...userWatchlist.items];
    newUserWatchlistItems.splice(index, 1);
    updateUserWatchlist((prev) => ({ ...prev, items: newUserWatchlistItems }));
    await uploadUserWatchlist(userWatchlist.groups, newUserWatchlistItems);
    logEvent(analytics, "Remove Watchlist Item", {
      UID: parentUser.accountID,
    });
    setSnackbarData((prev) => ({
      ...prev,
      open: true,
      message: `${item.name} Removed`,
      severity: "error",
      autoHideDuration: 2000,
    }));
  };

  let mainItemPrice = evePrices.find((i) => i.typeID === item.typeID);
  let totalPurchase = 0;
  let totalBuild = 0;
  item.materials.forEach((mat) => {
    let itemPrice = evePrices.find((i) => i.typeID === mat.typeID);

    totalPurchase +=
      (itemPrice[parentUser.settings.editJob.defaultMarket][
        parentUser.settings.editJob.defaultOrders
      ] *
        mat.quantity) /
      item.quantity;
    if (mat.materials.length === 0) {
      totalBuild +=
        (itemPrice[parentUser.settings.editJob.defaultMarket][
          parentUser.settings.editJob.defaultOrders
        ] *
          mat.quantity) /
        item.quantity;
    }
    mat.materials.forEach((cMat) => {
      let itemCPrice = evePrices.find((i) => i.typeID === cMat.typeID);
      let cMatBuild = 0;
      cMatBuild +=
        (itemCPrice[parentUser.settings.editJob.defaultMarket][
          parentUser.settings.editJob.defaultOrders
        ] *
          cMat.quantity) /
        mat.quantityProduced;
      totalBuild += cMatBuild * mat.quantity;
    });
  });

  totalBuild = totalBuild / item.quantity;
  return (
    <Grid container item xs={12}>
      <Paper
        square
        sx={{
          width: "100%",
          marginBottom: "1px",
          padding: " 10px 20px",
        }}
      >
        <Grid container item xs={12}>
          <Grid
            item
            xs={2}
            sm={1}
            justifyContent="center"
            alignItems="center"
            sx={{ display: "flex" }}
          >
            <img
              src={`https://images.evetech.net/types/${item.typeID}/icon?size=32`}
              alt=""
            />
          </Grid>
          <Grid
            container
            item
            xs={10}
            sm={2}
            lg={2}
            alignItems="center"
            sx={{ marginBottom: { xs: "20px", sm: "0px" } }}
          >
            <Typography sx={{ typography: { xs: "subtitle2", sm: "body2" } }}>
              {item.name}
            </Typography>
          </Grid>
          <Grid
            container
            item
            xs={12}
            sm={3}
            lg={2}
            sx={{
              color:
                mainItemPrice[parentUser.settings.editJob.defaultMarket]
                  .sell !== 0
                  ? "none"
                  : "success.main",
              marginBottom: { xs: "5px", sm: "0px" },
            }}
            justifyContent="center"
            alignItems="center"
          >
            <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
              {mainItemPrice[
                parentUser.settings.editJob.defaultMarket
              ].sell.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Typography>
          </Grid>
          <Grid
            container
            item
            xs={12}
            sm={3}
            lg={3}
            justifyContent="center"
            alignItems="center"
            sx={{ marginBottom: { xs: "5px", sm: "0px" } }}
          >
            <Typography
              sx={{
                typography: { xs: "caption", sm: "body2" },
                color:
                  totalPurchase <
                  mainItemPrice[parentUser.settings.editJob.defaultMarket].sell
                    ? totalBuild < totalPurchase
                      ? "orange"
                      : "success.main"
                    : "error.main",
              }}
            >
              {totalPurchase.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Typography>
          </Grid>
          <Grid
            container
            item
            xs={12}
            sm={3}
            lg={3}
            justifyContent="center"
            alignItems="center"
            sx={{ marginBottom: { xs: "5px", sm: "0px" } }}
          >
            {!item.childJobPresent && (
              <Typography
                align="center"
                sx={{
                  typography: { xs: "caption", sm: "body2" },
                }}
              >
                N/A
              </Typography>
            )}
            {item.childJobPresent && (
              <Typography
                align="center"
                sx={{
                  typography: { xs: "caption", sm: "body2" },
                  color:
                    totalBuild <
                    mainItemPrice[parentUser.settings.editJob.defaultMarket]
                      .sell
                      ? totalBuild > totalPurchase
                        ? "orange"
                        : "success.main"
                      : "error.main",
                }}
              >
                {totalBuild.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Typography>
            )}
          </Grid>
          <Grid
            item
            xs={12}
            sm={1}
            align="center"
            sx={{ display: { xs: "none", lg: "flex" } }}
          >
            <Tooltip
              title="Remove Item From Watchlist"
              arrow
              placement="bottom"
            >
              <IconButton color="error" onClick={handleRemove}>
                <ClearIcon />
              </IconButton>
            </Tooltip>
          </Grid>
          {!expanded && (
            <Grid item xs={12} align="center">
              <Tooltip title="More Information" arrow placement="bottom">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => {
                    setExpanded((prev) => !prev);
                  }}
                >
                  <ExpandMoreIcon />
                </IconButton>
              </Tooltip>
            </Grid>
          )}
        </Grid>
        {expanded && (
          <Grid
            container
            item
            xs={12}
            spacing={1}
            sx={{
              marginBottom: "20px",
              marginTop: "20px",
              position: "relative",
            }}
          >
            {item.materials.map((mat) => {
              let matPrice = evePrices.find((i) => i.typeID === mat.typeID);
              let matBuildPrice = 0;
              mat.materials.forEach((x) => {
                let matBuildCalc = 0;
                let xPrice = evePrices.find((i) => i.typeID === x.typeID);
                matBuildCalc +=
                  (xPrice[parentUser.settings.editJob.defaultMarket][
                    parentUser.settings.editJob.defaultOrders
                  ] *
                    x.quantity) /
                  mat.quantityProduced;
                matBuildPrice += matBuildCalc * mat.quantity;
              });
              matBuildPrice = matBuildPrice / mat.quantity;

              return (
                <Grid key={mat.id} container item xs={6} lg={2}>
                  <Grid item xs={12} align="center">
                    <img
                      src={`https://images.evetech.net/types/${mat.typeID}/icon?size=32`}
                      alt=""
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography
                      align="center"
                      sx={{
                        typography: { xs: "caption", sm: "body2" },
                      }}
                    >
                      {mat.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} lg={4}>
                    <Typography
                      align="center"
                      sx={{
                        typography: { xs: "caption", sm: "body2" },
                      }}
                    >
                      Sell Price
                    </Typography>
                  </Grid>
                  <Grid
                    item
                    xs={12}
                    lg={8}
                    sx={{
                      color:
                        mat.materials.length > 0
                          ? matBuildPrice <
                            matPrice[parentUser.settings.editJob.defaultMarket]
                              .sell
                            ? "error.main"
                            : "success.main"
                          : "none",
                    }}
                  >
                    <Typography
                      align="center"
                      sx={{
                        typography: { xs: "caption", sm: "body2" },
                      }}
                    >
                      {matPrice[
                        parentUser.settings.editJob.defaultMarket
                      ].sell.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Typography>
                  </Grid>
                  <Grid container item xs={12}>
                    {mat.materials.length > 0 && (
                      <>
                        <Grid item xs={12} lg={4}>
                          <Typography
                            align="center"
                            sx={{
                              typography: { xs: "caption", sm: "body2" },
                            }}
                          >
                            Build Price
                          </Typography>
                        </Grid>
                        <Grid
                          item
                          xs={12}
                          lg={8}
                          sx={{
                            color:
                              matBuildPrice >
                              matPrice[
                                parentUser.settings.editJob.defaultMarket
                              ].sell
                                ? "error.main"
                                : "success.main",
                          }}
                        >
                          <Typography
                            align="center"
                            sx={{
                              typography: { xs: "caption", sm: "body2" },
                            }}
                          >
                            {matBuildPrice.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </Typography>
                        </Grid>
                      </>
                    )}
                  </Grid>
                </Grid>
              );
            })}
            <Grid item xs={12} sx={{ marginTop: "10px" }}>
              <FormControl
                className={classes.Select}
                sx={{
                  width: "140px",
                }}
              >
                <Select
                  variant="standard"
                  size="small"
                  value={item.group}
                  onChange={(e) => {
                    let newUserWatchlistItems = [...userWatchlist.items];

                    newUserWatchlistItems[index].group = e.target.value;
                    updateUserWatchlist((prev)=>({...prev, items: newUserWatchlistItems}));
                    uploadUserWatchlist(userWatchlist.groups, newUserWatchlistItems);
                  }}
                >
                  <MenuItem value={0}>None</MenuItem>
                  {userWatchlist.groups.map((entry) => {
                    return (
                      <MenuItem key={entry.id} value={entry.id}>
                        {entry.name}
                      </MenuItem>
                    );
                  })}
                </Select>
                <FormHelperText variant="standard">
                  Watchlist Group
                </FormHelperText>
              </FormControl>
            </Grid>
            <Grid item align="center" xs={12} sx={{ marginTop: "5px" }}>
              <Tooltip title="Less Information" arrow placement="bottom">
                <IconButton
                  color="primary"
                  onClick={() => {
                    setExpanded((prev) => !prev);
                  }}
                >
                  <ExpandLessIcon />
                </IconButton>
              </Tooltip>
              <Tooltip
                title="Remove Item From Watchlist"
                arrow
                placement="bottom"
              >
                <IconButton
                  size="small"
                  color="error"
                  onClick={handleRemove}
                  sx={{
                    position: "absolute",
                    bottom: "10px",
                    right: "10px",
                    display: { lg: "none" },
                  }}
                >
                  <ClearIcon />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        )}
      </Paper>
    </Grid>
  );
}
