import { Box, Typography } from "@mui/material";

import MaterialPopoverIconButtons from "../../../../../../Styled Components/Popover/iconButtons";
import {
  FigureCaption,
  Figure,
} from "../../../../../../Styled Components/Typography/figures";
import { formatNumberForLocale } from "../../../../../../Functions/Helper/numberParser";

/**
 * What the job makes, and what the market pays for one.
 *
 * Carries the market links, which are the only way to reach an item's price
 * history from this stage, and the item's own icon — how a player recognises
 * what they are looking at before reading a word of it.
 *
 * @param {object} props
 * @param {number} props.typeID
 * @param {string} props.name
 * @param {string} props.priceHubID - The hub the price and the links are for
 * @param {string} props.priceHubName
 * @param {number} props.unitPrice - Sell-side, per unit
 * @param {number} props.quantityProduced
 */
export default function OutputHeader({
  typeID,
  name,
  priceHubID,
  priceHubName,
  unitPrice,
  quantityProduced,
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
      <Box
        component="img"
        src={`https://images.evetech.net/types/${typeID}/icon?size=32`}
        alt=""
        sx={{ width: 32, height: 32, flexShrink: 0 }}
      />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <MaterialPopoverIconButtons typeID={typeID} regionID={priceHubID}>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {name}
          </Typography>
        </MaterialPopoverIconButtons>
        <Typography variant="caption" color="text.secondary">
          {formatNumberForLocale(quantityProduced, { max: 0 })} at{" "}
          {formatNumberForLocale(unitPrice)} each
          {priceHubName ? ` on the ${priceHubName} market` : ""}
        </Typography>
      </Box>
      <Box sx={{ textAlign: "right" }}>
        <FigureCaption>Revenue, listed</FigureCaption>
        <Figure sx={{ display: "block" }}>
          {formatNumberForLocale(unitPrice * quantityProduced)}
        </Figure>
      </Box>
    </Box>
  );
}
