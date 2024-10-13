import { Highlight, Search } from "@mui/icons-material";
import {
  Avatar,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  Grid,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import { useContext, useMemo, useState } from "react";
import { useGroupManagement } from "../../../../../Hooks/useGroupManagement";
import { TWO_DECIMAL_PLACES } from "../../../../../Context/defaultValues";
import { EvePricesContext } from "../../../../../Context/EveDataContext";
import { ApplicationSettingsContext } from "../../../../../Context/LayoutContext";
import { useNavigate, useOutlet } from "react-router-dom";
import {
  ActiveJobContext,
  JobArrayContext,
} from "../../../../../Context/JobContext";
import findJobsToHighlight from "./findJobsToHighlight";

function OutputJobCard({ inputJob, updateHighlightedItem, highlightedItems }) {
  const { activeGroup } = useContext(ActiveJobContext);
  const { jobArray } = useContext(JobArrayContext);
  const { evePrices } = useContext(EvePricesContext);
  const { calculateCurrentJobBuildCostFromChildren } = useGroupManagement();
  const { applicationSettings } = useContext(ApplicationSettingsContext);
  const navigate = useNavigate();

  const CurrentBuildCost =
    calculateCurrentJobBuildCostFromChildren(inputJob)?.toLocaleString(
      undefined,
      TWO_DECIMAL_PLACES
    ) || 0;

  const currentMarketPrice =
    evePrices[inputJob.itemID]?.[applicationSettings.defaultMarket]?.[
      applicationSettings.defaultOrders
    ]?.toLocaleString(undefined, TWO_DECIMAL_PLACES) || 0;

  const isHighlighted = highlightedItems.has(inputJob.jobID);

  return (
    <Card variant="elevation" square sx={{ marginBottom: "5px" }}>
      <CardActionArea
        onClick={() => {
          navigate(
            `/editJob/${inputJob.jobID}?activeGroup=${encodeURIComponent(
              activeGroup
            )}`
          );
        }}
      >
        <CardContent>
          <Grid container alignItems="center" spacing={1}>
            <Grid item xs={10}>
              <Typography variant="caption">{inputJob.name}</Typography>
            </Grid>
            <Grid item xs={2}>
              <Avatar
                src={`https://images.evetech.net/types/${inputJob.itemID}/icon?size=32`}
                alt={inputJob.name}
                variant="square"
                sx={{ height: 32, width: 32 }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption">
                Quantity Produced: {inputJob.build.products.totalQuantity}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption">
                Current Item Build Cost: {CurrentBuildCost}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption">
                Current Market Price: {currentMarketPrice}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
        <CardActions sx={{ justifyContent: "flex-end" }}>
          <Tooltip
            title="Highlight jobs within the production chain."
            arrow
            placement="left"
          >
            <IconButton
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                if (highlightedItems.has(inputJob.jobID)) {
                  updateHighlightedItem(new Set());
                } else {
                  updateHighlightedItem(
                    findJobsToHighlight(inputJob, jobArray)
                  );
                }
              }}
            >
              <Highlight color={isHighlighted ? "primary" : "secondary"} />
            </IconButton>
          </Tooltip>
        </CardActions>
      </CardActionArea>
    </Card>
  );
}

export default OutputJobCard;
