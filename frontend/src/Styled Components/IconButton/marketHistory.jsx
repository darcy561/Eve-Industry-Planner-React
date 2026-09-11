import { IconButton, Tooltip } from "@mui/material";
import { showPriceHistoryDialogue } from "../../Events/dialogueEvents";
import TimelineIcon from "@mui/icons-material/Timeline";
import useUsersStore from "../../Zustand/usersStore";
import GLOBAL_CONFIG from "../../global-config-app";

const { MARKET_OPTIONS, DEFAULT_REGION } = GLOBAL_CONFIG;

/**
 * An icon button component that opens the price history dialogue for a specific item.
 * Displays historical pricing data and charts for the given item and region.
 *
 * @param {Object} props - Component props
 * @param {number} props.itemTypeID - EVE Online type ID of the item to view price history for
 * @param {string|Object} [props.regionID] - Market hub `id` from `MARKET_OPTIONS` or row object. If not provided, uses default market or `MARKET_OPTIONS` row where `regionID` is `DEFAULT_REGION` (The Forge).
 * @param {Object} [props.iconButtonStyle] - Custom styling for the icon button
 * @param {Object} [props.iconStyle] - Custom styling for the timeline icon
 * @param {string} [props.tooltipText="Item Price History"] - Text to display in the tooltip
 * @param {string} [props.tooltipPlacement="top"] - Placement of the tooltip relative to the button
 * @returns {JSX.Element} Market history icon button component
 */
function MarketHistoryIconButton({
  itemTypeID,
  regionID,
  iconButtonStyle,
  iconStyle,
  tooltipText = "Item Price History",
  tooltipPlacement = "top",
}) {
  let marketRegion = regionID;

  if (!marketRegion) {
    marketRegion =
      MARKET_OPTIONS.find(
        (i) =>
          i.id ===
          useUsersStore.getState().applicationSettings.defaultMarketLocation,
      ) ?? MARKET_OPTIONS.find((i) => i.regionID === DEFAULT_REGION);
  }

  if (typeof marketRegion === "string") {
    marketRegion = MARKET_OPTIONS.find((i) => i.id === marketRegion);
  }

  return (
    <Tooltip title={tooltipText} arrow placement={tooltipPlacement}>
      <IconButton
        color="primary"
        size="small"
        onClick={() => showPriceHistoryDialogue(itemTypeID, marketRegion)}
        sx={{ ...iconButtonStyle }}
      >
        <TimelineIcon sx={{ ...iconStyle }} />
      </IconButton>
    </Tooltip>
  );
}

export default MarketHistoryIconButton;
