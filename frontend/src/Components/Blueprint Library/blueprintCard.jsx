import { useState } from "react";
import { Badge, Box, IconButton, Tooltip, Typography } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import { appShellNestedCardSx } from "../../Context/appShell";
import { jobTypes } from "../../Context/defaultValues";
import blueprintHolderLabel, {
  blueprintOwner,
} from "../../Functions/Blueprints/blueprintHolderLabel";
import { stackCount } from "../../Functions/Blueprints/consolidateBlueprints";
import { eveImageSize } from "../../Functions/Shared/eveOwner";
import { formatNumberForLocale } from "../../Functions/Helper/numberParser";
import OwnerAvatar from "../../Styled Components/Avatar/OwnerAvatar";
import { ActiveBPPopout } from "./ActiveBPPout";
import { blueprintAccentColor } from "./blueprintStatus";

/**
 * How much room a card is given. The two library views differ in this and nothing else.
 *
 * `columns` is the panel's grid template rather than the card's, because it is the panel that
 * decides how many fit across. Both use `auto-fit`, which collapses the tracks it cannot fill so a
 * panel holding one card gives that card the whole row — `auto-fill` leaves the empty tracks in
 * place and strands the card at the left.
 *
 * @type {Readonly<Record<string, {art: number, owner: number, figure: number, stackedFigures: boolean, padding: number, columns: string}>>}
 */
export const BLUEPRINT_CARD_DENSITY = Object.freeze({
  STANDARD: {
    art: 64,
    owner: 24,
    figure: 76,
    stackedFigures: true,
    padding: 1.5,
    columns: "1fr",
  },
  COMPACT: {
    art: 40,
    owner: 18,
    figure: 64,
    stackedFigures: false,
    padding: 1,
    columns: "repeat(auto-fit, minmax(240px, 1fr))",
  },
});

/**
 * One card in a blueprint panel: a shelf of interchangeable blueprints, or a single one with a job
 * running on it.
 *
 * @param {{
 *   stack: import("../../Functions/Blueprints/consolidateBlueprints").BlueprintStack,
 *   bpData?: {jobType: number},
 *   locationName?: string,
 *   density?: typeof BLUEPRINT_CARD_DENSITY.STANDARD
 * }} props
 */
export default function BlueprintCard({
  stack,
  bpData,
  locationName,
  density = BLUEPRINT_CARD_DENSITY.COMPACT,
}) {
  const [popoverAnchor, setPopoverAnchor] = useState(null);
  const { blueprint, esiJob } = stack;

  const held = stackCount(stack);
  const kind = blueprint.isCopy ? "bpc" : "bp";
  const isManufacturing = bpData?.jobType === jobTypes.manufacturing;

  return (
    <Box
      sx={[
        appShellNestedCardSx,
        {
          // Not the `border` shorthand: it would reset the tinted colour the token sets.
          borderWidth: 1,
          borderStyle: "solid",
          padding: density.padding,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          // The stripe is the card's leading edge rather than a bar beneath it, so a shelf being
          // built is picked out down a column of cards without costing a row of height.
          borderLeftWidth: 3,
          borderLeftColor: blueprintAccentColor(
            esiJob,
            blueprint.isCopy,
            blueprint.runs
          ),
        },
      ]}
    >
      <Tooltip
        title={blueprintHolderLabel(blueprint, locationName)}
        arrow
        placement="top"
      >
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          badgeContent={
            <OwnerAvatar owner={blueprintOwner(blueprint)} size={density.owner} />
          }
        >
          <Box
            component="img"
            src={`https://images.evetech.net/types/${blueprint.typeId}/${kind}?size=${eveImageSize(density.art)}`}
            alt=""
            sx={{
              height: density.art,
              width: density.art,
              display: "block",
              borderRadius: 1,
              flexShrink: 0,
            }}
          />
        </Badge>
      </Tooltip>

      {/* Spread across whatever width the card has, so the figures line up down the panel rather
          than bunching at the left. */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: "grid",
          gridTemplateColumns: `repeat(auto-fit, minmax(${density.figure}px, 1fr))`,
          columnGap: 1,
          rowGap: 0.25,
        }}
      >
        {isManufacturing && (
          <>
            <Figure label="M.E" value={blueprint.me} density={density} />
            <Figure label="T.E" value={blueprint.te} density={density} />
          </>
        )}
        {blueprint.runs !== -1 && (
          <Figure label="Runs" value={blueprint.runs} density={density} />
        )}
        <Figure label="Held" value={held} density={density} />
      </Box>

      {esiJob && (
        <Tooltip title="Job details" arrow placement="bottom">
          <IconButton
            size="small"
            color="primary"
            sx={{ flexShrink: 0 }}
            aria-label={`Job details for ${blueprintHolderLabel(blueprint, locationName)}`}
            onClick={(event) => setPopoverAnchor(event.currentTarget)}
          >
            <InfoOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {esiJob && (
        <ActiveBPPopout
          blueprint={blueprint}
          esiJob={esiJob}
          displayPopover={popoverAnchor}
          updateDisplayPopover={setPopoverAnchor}
        />
      )}
    </Box>
  );
}

function Figure({ label, value, density }) {
  const shown = formatNumberForLocale(value, { max: 0 });

  if (!density.stackedFigures) {
    return (
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}
      >
        {label}:{" "}
        <Box component="span" sx={{ color: "text.primary" }}>
          {shown}
        </Box>
      </Typography>
    );
  }

  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", lineHeight: 1.2 }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{ fontVariantNumeric: "tabular-nums", lineHeight: 1.3 }}
      >
        {shown}
      </Typography>
    </Box>
  );
}
