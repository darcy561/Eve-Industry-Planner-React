import { IconButton, Tooltip } from "@mui/material";
import {
  PRICING_SIDE,
  resolvePricingSide,
} from "../../Functions/MarketData/pricingSide.js";
import { showMarketDataDialogue } from "../../Events/dialogueEvents";
import LocalAtmIcon from "@mui/icons-material/LocalAtm";
import useUsersStore from "../../Zustand/usersStore";
import GLOBAL_CONFIG from "../../global-config-app";

const { MARKET_OPTIONS } = GLOBAL_CONFIG;

/**
 * An icon button component that opens the market data dialogue for a specific item.
 * Displays current market orders and pricing information for the given item and location.
 *
 * @param {Object} props - Component props
 * @param {number} props.itemTypeID - EVE Online type ID of the item to view market data for
 * @param {string|Object} [props.locationID] - Market location ID or object. If not provided, uses user's default market.
 * @param {Object} [props.iconButtonStyle] - Custom styling for the icon button
 * @param {Object} [props.iconStyle] - Custom styling for the local ATM icon
 * @param {string} [props.tooltipText="Current Market Data"] - Text to display in the tooltip
 * @param {string} [props.tooltipPlacement="top"] - Placement of the tooltip relative to the button
 * @returns {JSX.Element} Market data icon button component
 */
function MarketDataIconButton({
  itemTypeID,
  locationID,
  iconButtonStyle,
  iconStyle,
  tooltipText = "Current Market Data",
  tooltipPlacement = "top",
  side = PRICING_SIDE.BUYING,
}) {
  let marketLocation = locationID;

  if (!marketLocation) {
    // The market a link points at is the one the figure beside it came from.
    // Where a caller has none to give, the side it is pricing decides.
    const { marketDisplay } = resolvePricingSide({
      accountPricing:
        useUsersStore.getState().applicationSettings.defaultPricing,
      side,
    });
    marketLocation = MARKET_OPTIONS.find((i) => i.id === marketDisplay);
  }

  if (typeof marketLocation === "string") {
    marketLocation = MARKET_OPTIONS.find((i) => i.id === marketLocation);
  }

  return (
    <Tooltip title={tooltipText} arrow placement={tooltipPlacement}>
      <IconButton
        color="primary"
        onClick={() => showMarketDataDialogue(itemTypeID, marketLocation)}
        sx={{ ...iconButtonStyle }}
      >
        <LocalAtmIcon sx={{ ...iconStyle }} />
      </IconButton>
    </Tooltip>
  );
}

export default MarketDataIconButton;
