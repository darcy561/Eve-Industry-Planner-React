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
import { useCallback, useContext, useState } from "react";
import { EvePricesContext } from "../../../../Context/EveDataContext";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ClearIcon from "@mui/icons-material/Clear";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  UserJobSnapshotContext,
  UserWatchlistContext,
} from "../../../../Context/AuthContext";
import { useFirebase } from "../../../../Hooks/useFirebase";
import { SnackBarDataContext } from "../../../../Context/LayoutContext";
import { getAnalytics, logEvent } from "firebase/analytics";
import { ExpandedWatchlistRow } from "./ItemRowExpanded";
import AddIcon from "@mui/icons-material/Add";
import { useJobBuild } from "../../../../Hooks/useJobBuild";
import { useJobManagement } from "../../../../Hooks/useJobManagement";
import { JobArrayContext } from "../../../../Context/JobContext";
import { trace } from "firebase/performance";
import { performance } from "../../../../firebase";
import { useJobSnapshotManagement } from "../../../../Hooks/JobHooks/useJobSnapshots";

export function WatchListRow({ item, parentUser, index }) {
  const [expanded, setExpanded] = useState(false);
  const { userWatchlist, updateUserWatchlist } =
    useContext(UserWatchlistContext);
  const { updateJobArray } = useContext(JobArrayContext);
  const { userJobSnapshot, updateUserJobSnapshot } = useContext(
    UserJobSnapshotContext
  );
  const { evePrices, updateEvePrices } = useContext(EvePricesContext);
  const {
    addNewJob,
    getItemPrices,
    uploadUserJobSnapshot,
    uploadUserWatchlist,
  } = useFirebase();
  const { checkAllowBuild, buildJob } = useJobBuild();
  const { generatePriceRequestFromJob } = useJobManagement();
  const { newJobSnapshot } = useJobSnapshotManagement();
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const analytics = getAnalytics();
  const t = trace(performance, "CreateJobProcessFull");

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

  const handleAdd = async () => {
    t.start();
    if (!checkAllowBuild) return;

    let newJob = await buildJob({
      itemID: item.typeID,
    });

    if (newJob === undefined) return;

    let promiseArray = [
      getItemPrices(generatePriceRequestFromJob(newJob), parentUser),
    ];

    let newUserJobSnapshot = newJobSnapshot(newJob, [...userJobSnapshot]);

    addNewJob(newJob);
    uploadUserJobSnapshot(newUserJobSnapshot);
    logEvent(analytics, "New Job", {
      loggedIn: true,
      UID: parentUser.accountID,
      name: newJob.name,
      itemID: newJob.itemID,
    });

    let returnPromiseArray = await Promise.all(promiseArray);

    updateUserJobSnapshot(newUserJobSnapshot);
    updateEvePrices((prev) => {
      const prevIds = new Set(prev.map((item) => item.typeID));
      const uniqueNewEvePrices = returnPromiseArray[0].filter(
        (item) => !prevIds.has(item.typeID)
      );
      return [...prev, ...uniqueNewEvePrices];
    });
    updateJobArray((prev) => [...prev, newJob]);
    setSnackbarData((prev) => ({
      ...prev,
      open: true,
      message: `${newJob.name} Added`,
      severity: "success",
      autoHideDuration: 3000,
    }));
    t.stop();
  };

  let buildCosts = useCallback(() => {
    let totalPurchase = 0;
    let totalBuild = 0;
    let missingItemCost = {
      jita: {
        buy: 0,
        sell: 0,
      },
      amarr: {
        buy: 0,
        sell: 0,
      },
      dodixie: {
        buy: 0,
        sell: 0,
      },
    };
    let mainItemPrice = evePrices.find((i) => i.typeID === item.typeID);
    if (mainItemPrice === undefined) {
      mainItemPrice = missingItemCost;
    }

    item.materials.forEach((mat) => {
      let itemPrice = evePrices.find((i) => i.typeID === mat.typeID);

      if (itemPrice === undefined) {
        itemPrice = missingItemCost;
      }

      totalPurchase +=
        (itemPrice[parentUser.settings.editJob.defaultMarket][
          parentUser.settings.editJob.defaultOrders
        ] *
          mat.quantity) /
        item.quantity;
      if (mat.materials.length === 0) {
        totalBuild +=
          itemPrice[parentUser.settings.editJob.defaultMarket][
            parentUser.settings.editJob.defaultOrders
          ] * mat.quantity;
        return;
      }
      let matBuild = 0;
      mat.materials.forEach((cMat) => {
        let itemCPrice = evePrices.find((i) => i.typeID === cMat.typeID);
        matBuild +=
          itemCPrice[parentUser.settings.editJob.defaultMarket][
            parentUser.settings.editJob.defaultOrders
          ] * cMat.quantity;
      });
      matBuild = matBuild / mat.quantityProduced;
      totalBuild += matBuild * mat.quantity;
    });

    totalBuild = totalBuild / item.quantity;
    return {
      totalBuild: totalBuild,
      totalPurchase: totalPurchase,
      mainItemPrice: mainItemPrice,
    };
  }, [evePrices]);

  const calculatedCosts = buildCosts();

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
                calculatedCosts.mainItemPrice[
                  parentUser.settings.editJob.defaultMarket
                ].sell !== 0
                  ? "none"
                  : "success.main",
              marginBottom: { xs: "5px", sm: "0px" },
            }}
            justifyContent="center"
            alignItems="center"
          >
            <Typography sx={{ typography: { xs: "caption", sm: "body2" } }}>
              {calculatedCosts.mainItemPrice[
                parentUser.settings.editJob.defaultMarket
              ].sell.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Typography>
          </Grid>
          <Grid
            item
            xs={12}
            sm={3}
            lg={3}
            sx={{ marginBottom: { xs: "5px", sm: "0px" } }}
          >
            <Grid
              container
              item
              xs={12}
              justifyContent="center"
              alignItems="center"
            >
              <Typography
                sx={{
                  typography: { xs: "caption", sm: "body2" },
                  color:
                    calculatedCosts.totalPurchase <
                    calculatedCosts.mainItemPrice[
                      parentUser.settings.editJob.defaultMarket
                    ].sell
                      ? calculatedCosts.totalBuild <
                        calculatedCosts.totalPurchase
                        ? "orange"
                        : "success.main"
                      : "error.main",
                }}
              >
                {calculatedCosts.totalPurchase.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Typography>
            </Grid>
            <Grid
              container
              item
              xs={12}
              justifyContent="center"
              alignItems="center"
            >
              <Tooltip
                title={(
                  ((calculatedCosts.totalPurchase -
                    calculatedCosts.mainItemPrice[
                      parentUser.settings.editJob.defaultMarket
                    ].sell) /
                    calculatedCosts.totalPurchase) *
                  100
                ).toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 4,
                })}
                arrow
                placement="bottom"
              >
                <Typography
                  sx={{
                    typography: "caption",
                    color:
                      calculatedCosts.totalPurchase <
                      calculatedCosts.mainItemPrice[
                        parentUser.settings.editJob.defaultMarket
                      ].sell
                        ? calculatedCosts.totalBuild <
                          calculatedCosts.totalPurchase
                          ? "orange"
                          : "success.main"
                        : "error.main",
                  }}
                >
                  {(
                    ((calculatedCosts.totalPurchase -
                      calculatedCosts.mainItemPrice[
                        parentUser.settings.editJob.defaultMarket
                      ].sell) /
                      calculatedCosts.totalPurchase) *
                    100
                  ).toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                  %
                </Typography>
              </Tooltip>
            </Grid>
          </Grid>
          <Grid
            container
            item
            xs={12}
            sm={3}
            lg={3}
            sx={{ marginBottom: { xs: "5px", sm: "0px" } }}
          >
            {!item.childJobPresent && (
              <Grid
                container
                item
                xs={12}
                justifyContent="center"
                alignItems="center"
              >
                <Typography
                  align="center"
                  sx={{
                    typography: { xs: "caption", sm: "body2" },
                  }}
                >
                  N/A
                </Typography>
              </Grid>
            )}
            {item.childJobPresent && (
              <>
                <Grid
                  container
                  item
                  xs={12}
                  justifyContent="center"
                  alignItems="center"
                >
                  <Typography
                    align="center"
                    sx={{
                      typography: { xs: "caption", sm: "body2" },
                      color:
                        calculatedCosts.totalBuild <
                        calculatedCosts.mainItemPrice[
                          parentUser.settings.editJob.defaultMarket
                        ].sell
                          ? calculatedCosts.totalBuild >
                            calculatedCosts.totalPurchase
                            ? "orange"
                            : "success.main"
                          : "error.main",
                    }}
                  >
                    {calculatedCosts.totalBuild.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Typography>
                </Grid>
                <Grid
                  container
                  item
                  xs={12}
                  justifyContent="center"
                  alignItems="center"
                >
                  <Tooltip
                    title={(
                      ((calculatedCosts.totalBuild -
                        calculatedCosts.mainItemPrice[
                          parentUser.settings.editJob.defaultMarket
                        ].sell) /
                        calculatedCosts.totalBuild) *
                      100
                    ).toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 4,
                    })}
                    arrow
                    placement="bottom"
                  >
                    <Typography
                      align="center"
                      sx={{
                        typography: { xs: "caption", sm: "body2" },
                        color:
                          calculatedCosts.totalBuild <
                          calculatedCosts.mainItemPrice[
                            parentUser.settings.editJob.defaultMarket
                          ].sell
                            ? calculatedCosts.totalBuild >
                              calculatedCosts.totalPurchase
                              ? "orange"
                              : "success.main"
                            : "error.main",
                      }}
                    >
                      {(
                        ((calculatedCosts.totalBuild -
                          calculatedCosts.mainItemPrice[
                            parentUser.settings.editJob.defaultMarket
                          ].sell) /
                          calculatedCosts.totalBuild) *
                        100
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                      %
                    </Typography>
                  </Tooltip>
                </Grid>
              </>
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
          {!expanded ? (
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
          ) : (
            <>
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
                  return (
                    <ExpandedWatchlistRow
                      key={mat.id}
                      mat={mat}
                      parentUser={parentUser}
                    />
                  );
                })}
              </Grid>
              <Grid container item xs={12} sx={{ marginTop: "10px" }}>
                <Grid item xs={2}>
                  <FormControl
                    fullWidth
                    sx={{
                      "& .MuiFormHelperText-root": {
                        color: (theme) => theme.palette.secondary.main,
                      },
                      "& input::-webkit-clear-button, & input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
                        {
                          display: "none",
                        },
                    }}
                  >
                    <Select
                      variant="standard"
                      size="small"
                      value={item.group}
                      onChange={(e) => {
                        let newUserWatchlistItems = [...userWatchlist.items];

                        newUserWatchlistItems[index].group = e.target.value;
                        updateUserWatchlist((prev) => ({
                          ...prev,
                          items: newUserWatchlistItems,
                        }));
                        uploadUserWatchlist(
                          userWatchlist.groups,
                          newUserWatchlistItems
                        );
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
                <Grid item xs={6} sx={{ paddingLeft: "10px" }}>
                  <Tooltip
                    title="Create a new job on the Job Planner."
                    arrow
                    placement="bottom"
                  >
                    <IconButton color="primary" onClick={handleAdd}>
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                </Grid>
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
            </>
          )}
        </Grid>
      </Paper>
    </Grid>
  );
}
