import { useEffect, useState } from "react";
import { Grid, Icon, Tooltip, Typography } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import { jobTypes } from "../../../../../../Context/defaultValues";
import GLOBAL_CONFIG from "../../../../../../global-config-app";
import { ChildJobPopoverFrame } from "./Child Job Pop Over/childJobPopoverFrame";

const { PRIMARY_THEME, SECONDARY_THEME } = GLOBAL_CONFIG;

export function MaterialCostRow_MaterialPricePanel({
  activeJob,
  updateActiveJob,
  material,
  marketSelect,
  listingSelect,
  itemPriceObject,
  jobModified,
  setJobModified,
  temporaryChildJobs,
  updateTemporaryChildJobs,
}) {
  const [displayPopover, updateDisplayPopover] = useState(null);
  const [childJobProductionCosts, updateChildJobProductionCosts] = useState({
    materialCost: 0,
    installCost: 0,
    finalCost: 0,
    finalCostPerItem:0
  });

  const marketObject = itemPriceObject[marketSelect];
  const currentMaterialPrice = itemPriceObject[marketSelect][listingSelect];

  return (
    <Grid
      container
      item
      xs={12}
      sx={{
        padding: { xs: "7px 0px", sm: "10px 0px" },
        backgroundColor: (theme) =>
          selectRowHighlightColor(theme, displayPopover),
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
                    updateDisplayPopover(event.currentTarget);
                  }}
                >
                  <InfoIcon fontSize="small" />
                </Icon>
              </Tooltip>
              <ChildJobPopoverFrame
                activeJob={activeJob}
                updateActiveJob={updateActiveJob}
                displayPopover={displayPopover}
                updateDisplayPopover={updateDisplayPopover}
                material={material}
                marketSelect={marketSelect}
                listingSelect={listingSelect}
                jobModified={jobModified}
                setJobModified={setJobModified}
                temporaryChildJobs={temporaryChildJobs}
                updateTemporaryChildJobs={updateTemporaryChildJobs}
                currentMaterialPrice={currentMaterialPrice}
                childJobProductionCosts={childJobProductionCosts}
                updateChildJobProductionCosts={updateChildJobProductionCosts}
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
                {marketObject.highestMarketPrice.toLocaleString()}
              </p>
              <p>
                Lowest Market Price:{" "}
                {marketObject.lowestMarketPrice.toLocaleString()}
              </p>
              <p>
                Daily Average Market Price:{" "}
                {marketObject.dailyAverageMarketPrice.toLocaleString()}
              </p>
              <p>
                Daily Average Order Quantity:{" "}
                {marketObject.dailyAverageOrderQuantity.toLocaleString()}
              </p>
              <p>
                Daily Average Unit Count:{" "}
                {marketObject.dailyAverageUnitCount.toLocaleString()}
              </p>
            </span>
          }
          arrow
          placement="top"
        >
          <Typography
            sx={{ typography: { xs: "caption", sm: "body2" } }}
            color={selectTextPriceHighlight(
              currentMaterialPrice,
              childJobProductionCosts.finalCostPerItem
            )}
          >
            {currentMaterialPrice.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
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
          color={selectTextPriceHighlight(
            currentMaterialPrice,
            childJobProductionCosts.finalCostPerItem
          )}
        >
          {(currentMaterialPrice * material.quantity).toLocaleString(
            undefined,
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }
          )}
        </Typography>
      </Grid>
    </Grid>
  );
}

function selectRowHighlightColor(theme, displayPopover) {
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

function selectTextPriceHighlight(currentMaterialPrice, calculatedChildPrice) {
  if (calculatedChildPrice === 0) return null;

  if (currentMaterialPrice >= calculatedChildPrice) {
    return "error.main";
  } else {
    return "success.main";
  }
}
