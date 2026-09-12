import { Typography, Tooltip } from "@mui/material";
import {
  PRICING_SIDE,
  resolvePricingSide,
} from "../../Functions/MarketData/pricingSide.js";
import { showPriceHistoryDialogue } from "../../Events/dialogueEvents";
import useUsersStore from "../../Zustand/usersStore";
import GLOBAL_CONFIG from "../../global-config-app";

const { MARKET_OPTIONS, DEFAULT_REGION } = GLOBAL_CONFIG;

/**
 * A clickable typography component that opens the price history dialogue.
 * Displays text that can be clicked to view historical pricing data for an EVE Online item.
 * Automatically determines market region if not provided.
 *
 * @param {Object} props - Component props
 * @param {number} props.itemTypeID - EVE Online type ID of the item to view price history for
 * @param {string|Object} [props.regionID] - Market hub `id` from `MARKET_OPTIONS` or row object. If not provided, uses default market or `MARKET_OPTIONS` row where `regionID` is `DEFAULT_REGION` (The Forge).
 * @param {string} props.text - Text content to display
 * @param {Object} [props.textStyle] - Custom styling for the typography component
 * @param {string} [props.tooltipText="Click to view item price history."] - Text to display in the tooltip
 * @param {string} [props.tooltipPlacement="top"] - Placement of the tooltip relative to the text
 * @returns {JSX.Element} Market history dialogue trigger text component
 */
function MarketHistoryDialogueTriggerText({
  itemTypeID,
  regionID,
  text,
  textStyle,
  tooltipText = "Click to view item price history.",
  tooltipPlacement = "top",
  side = PRICING_SIDE.BUYING,
}) {
  let marketRegion = regionID;

  if (!marketRegion) {
    // The market a link points at is the one the figure beside it came from.
    // Where a caller has none to give, the side it is pricing decides.
    const { marketDisplay } = resolvePricingSide({
      accountPricing:
        useUsersStore.getState().applicationSettings.defaultPricing,
      side,
    });
    marketRegion =
      MARKET_OPTIONS.find((i) => i.id === marketDisplay) ??
      MARKET_OPTIONS.find((i) => i.regionID === DEFAULT_REGION);
  }

  if (typeof marketRegion === "string") {
    marketRegion = MARKET_OPTIONS.find((i) => i.id === marketRegion);
  }

  return (
    <Tooltip title={tooltipText} arrow placement={tooltipPlacement}>
      <Typography
        sx={{ cursor: "pointer", ...textStyle }}
        onClick={() => {
          showPriceHistoryDialogue(itemTypeID, marketRegion);
        }}
      >
        {text}
      </Typography>
    </Tooltip>
  );
}

export default MarketHistoryDialogueTriggerText;
