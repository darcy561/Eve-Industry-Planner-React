import { useState } from "react";
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

/**
 * Chooses which of the four server-served price modes a panel's figures are
 * quoted on, showing what each does to the total it governs.
 *
 * Built for an `AppShellPanel` `action`, so it reads as a header control rather
 * than a form field: the panel already says what the figure is, and this says
 * what it is measured on.
 *
 * The effect is the point. A mode named alone is jargon — the trimmed percentile
 * figures especially — so each option carries its own total and how far that sits
 * from the one in effect.
 *
 * @param {object} props
 * @param {import("../../Functions/MarketData/materialPricing").BasisOption[]} props.options
 * @param {(basisID: string) => void} props.onChange
 * @param {(value: number) => string} props.formatValue - Renders a total as ISK
 * @param {string} [props.label] - What the totals are of, e.g. "Materials"
 * @param {boolean} [props.disabled]
 */
export default function PricingBasisSelect({
  options = [],
  onChange,
  formatValue,
  label,
  disabled = false,
}) {
  const [anchor, setAnchor] = useState(null);
  const current = options.find((option) => option.isCurrent) ?? options[0];

  if (!current) return null;

  const choose = (basisID) => {
    setAnchor(null);
    if (basisID !== current.id) onChange?.(basisID);
  };

  return (
    <>
      <Button
        size="small"
        color="inherit"
        disabled={disabled}
        endIcon={<ExpandMoreIcon />}
        onClick={(event) => setAnchor(event.currentTarget)}
        aria-haspopup="listbox"
        aria-expanded={Boolean(anchor)}
        sx={{ color: "secondary.main", textTransform: "none" }}
      >
        {current.label}
      </Button>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        slotProps={{ list: { role: "listbox", dense: true } }}
      >
        {label ? (
          <Typography
            variant="caption"
            sx={{ color: "secondary.main", px: 2, py: 0.5, display: "block" }}
          >
            {label}
          </Typography>
        ) : null}
        {options.map((option) => (
          <MenuItem
            key={option.id}
            role="option"
            aria-selected={option.isCurrent}
            selected={option.isCurrent}
            onClick={() => choose(option.id)}
            sx={{ gap: 3, justifyContent: "space-between" }}
          >
            <Typography variant="body2">{option.label}</Typography>
            <Box sx={{ textAlign: "right" }}>
              <Typography variant="body2">
                {formatValue(option.total)}
              </Typography>
              <BasisDelta delta={option.delta} formatValue={formatValue} />
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

/**
 * How far an option sits from the basis in effect. Colour marks sign only, and
 * the option in effect shows nothing rather than a zero.
 *
 * @param {object} props
 * @param {number} props.delta
 * @param {(value: number) => string} props.formatValue
 */
function BasisDelta({ delta, formatValue }) {
  if (!delta) return null;

  return (
    <Typography
      variant="caption"
      sx={{
        display: "block",
        color: delta < 0 ? "success.main" : "error.main",
      }}
    >
      {delta < 0 ? "−" : "+"}
      {formatValue(Math.abs(delta))}
    </Typography>
  );
}
