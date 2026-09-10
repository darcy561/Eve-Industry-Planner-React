import { ToggleButton, ToggleButtonGroup, Tooltip } from "@mui/material";

/**
 * Which pricing model the components are drawn from.
 *
 * It belongs on this panel rather than on Returns because it changes what the
 * components *are* — the materials line grows and the child-builds line
 * disappears — so the panel that draws them owns the switch, and Returns has
 * one meaning at a time.
 *
 * @enum {string}
 */
export const PRICING_MODEL = {
  CHEAPEST: "cheapest",
  BUY_ALL: "buyAll",
};

/**
 * @param {object} props
 * @param {string} props.value - One of PRICING_MODEL
 * @param {(value: string) => void} props.onChange
 * @param {boolean} [props.disabled]
 */
export default function PricingModelToggle({ value, onChange, disabled = false }) {
  return (
    <ToggleButtonGroup
      size="small"
      exclusive
      value={value}
      disabled={disabled}
      onChange={(_event, next) => {
        // A group with nothing selected has no meaning here — the cost is drawn
        // from one model or the other.
        if (next) onChange(next);
      }}
      aria-label="How the materials are priced"
    >
      <Tooltip title="Linked child builds price their material; everything else is bought" arrow>
        <ToggleButton value={PRICING_MODEL.CHEAPEST} sx={{ textTransform: "none" }}>
          Build where cheaper
        </ToggleButton>
      </Tooltip>
      <Tooltip title="Every material priced at market, as if nothing were built" arrow>
        <ToggleButton value={PRICING_MODEL.BUY_ALL} sx={{ textTransform: "none" }}>
          Buy everything
        </ToggleButton>
      </Tooltip>
    </ToggleButtonGroup>
  );
}
