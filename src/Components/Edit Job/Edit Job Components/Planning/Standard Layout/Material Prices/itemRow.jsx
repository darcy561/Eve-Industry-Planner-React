import { useEffect, useState } from "react";
import { Grid, Icon, Tooltip, Typography } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import { jobTypes } from "../../../../../../Context/defaultValues";
import GLOBAL_CONFIG from "../../../../../../global-config-app";
import { ChildJobPopover } from "./childJobPopOver";

const { PRIMARY_THEME, SECONDARY_THEME } = GLOBAL_CONFIG;

export function MaterialCostRow_MaterialPricePanel({
  activeJob,
  updateActiveJob,
  material,
  marketSelect,
  listingSelect,
  materialPrice,
  jobModified,
  setJobModified,
  materialIndex,
}) {
  const [displayPopover, updateDisplayPopover] = useState(null);
  const [currentPurchasePrice, updateCurrentPurchasePrice] = useState(
    materialPrice[marketSelect][listingSelect]
  );
  const [currentBuildPrice, updateCurrentBuildPrice] = useState(null);

  useEffect(() => {
    updateCurrentPurchasePrice(materialPrice[marketSelect][listingSelect]);
  }, [marketSelect, listingSelect, currentBuildPrice]);

  const marketSelection = materialPrice[marketSelect];

  return (
    <Grid
      container
      item
      xs={12}
      sx={{
        padding: { xs: "7px 0px", sm: "10px 0px" },
        backgroundColor: (theme) => selectHighlightColor(theme, displayPopover),
      }}
    >
      <Grid
        justifyContent="center"
        item
        xs={2}
        sm={1}
        sx={{
          display: { xs: "flex", md: "flex" },
          paddingRight: "5px",
        }}
      >
        <img
          src={`https://images.evetech.net/types/${material.typeID}/icon?size=32`}
          alt=""
        />
      </Grid>
      <Grid container item xs={10} md={4} align="left">
        <Grid item xs={11} alignItems="center" sx={{ display: "flex" }}>
          <Typography sx={{ typography: { xs: "caption", sm: "body1" } }}>
            {material.name}
          </Typography>
        </Grid>
        <Grid
          item
          xs={1}
          alignItems="center"
          justifyContent="center"
          sx={{ display: "flex" }}
        >
          {material.jobType === jobTypes.manufacturing ||
          material.jobType === jobTypes.reaction ? (
            <>
              <Tooltip
                title="Click To Compare Material Build Cost"
                arrow
                placement="bottom"
              >
                <Icon
                  aria-haspopup="true"
                  color="primary"
                    onClick={(event) => {
                    console.log(event.currentTarget)
                    updateDisplayPopover(event.currentTarget);
                    updateActiveJob((prev) => ({
                      ...prev,
                      layout: {
                        ...prev.layout,
                        childJobPopOverID: event.currentTarget,
                      },
                    }));
                  }}
                >
                  <InfoIcon fontSize="small" />
                </Icon>
              </Tooltip>
              <ChildJobPopover
                activeJob={activeJob}
                updateActiveJob={updateActiveJob}
                displayPopover={displayPopover}
                updateDisplayPopover={updateDisplayPopover}
                material={material}
                marketSelect={marketSelect}
                listingSelect={listingSelect}
                jobModified={jobModified}
                setJobModified={setJobModified}
                currentBuildPrice={currentBuildPrice}
                updateCurrentBuildPrice={updateCurrentBuildPrice}
                currentPurchasePrice={currentPurchasePrice}
                materialIndex={materialIndex}
              />
            </>
          ) : null}
        </Grid>
      </Grid>
      <Grid
        alignItems="center"
        justifyContent="center"
        item
        xs={6}
        md={3}
        align="center"
        sx={{
          marginTop: { xs: "10px", md: "0px" },
          display: "flex",
        }}
      >
        <Tooltip
          title={
            <span>
              <p>
                <b>30 Day Region Market History</b>
              </p>
              <p>
                Highest Market Price:{" "}
                {marketSelection.highestMarketPrice.toLocaleString()}
              </p>
              <p>
                Lowest Market Price:{" "}
                {marketSelection.lowestMarketPrice.toLocaleString()}
              </p>
              <p>
                Daily Average Market Price:{" "}
                {marketSelection.dailyAverageMarketPrice.toLocaleString()}
              </p>
              <p>
                Daily Average Order Quantity:{" "}
                {marketSelection.dailyAverageOrderQuantity.toLocaleString()}
              </p>
              <p>
                Daily Average Unit Count:{" "}
                {marketSelection.dailyAverageUnitCount.toLocaleString()}
              </p>
            </span>
          }
          arrow
          placement="top"
        >
          <Typography
            sx={{ typography: { xs: "caption", sm: "body2" } }}
            color={
              currentBuildPrice
                ? currentPurchasePrice >= currentBuildPrice
                  ? "error.main"
                  : "success.main"
                : null
            }
          >
            {materialPrice
              ? marketSelection[listingSelect].toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : 0}
          </Typography>
        </Tooltip>
      </Grid>
      <Grid
        alignItems="center"
        justifyContent="center"
        item
        xs={6}
        md={4}
        align="center"
        sx={{ marginTop: { xs: "10px", md: "0px" }, display: "flex" }}
      >
        <Typography
          sx={{ typography: { xs: "caption", sm: "body2" } }}
          color={
            currentBuildPrice
              ? currentPurchasePrice >= currentBuildPrice
                ? "error.main"
                : "success.main"
              : null
          }
        >
          {materialPrice
            ? (
                marketSelection[listingSelect] * material.quantity
              ).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : 0}
        </Typography>
      </Grid>
    </Grid>
  );
}

function selectHighlightColor(theme, displayPopover) {
  if (!displayPopover) return null;

  switch (theme.palette.mode) {
    case PRIMARY_THEME:
      return theme.palette.secondary.dark;

    case SECONDARY_THEME:
      return theme.palette.secondary.light;

    default:
      return theme.palette.secondary.main;
  }
}
