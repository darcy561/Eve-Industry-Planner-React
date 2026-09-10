import { Box, Chip } from "@mui/material";

/**
 * One choice out of a handful, as a row of chips.
 *
 * Distinct from {@link ../Chip/statusChip.jsx StatusChip}, which reports a state the player cannot
 * click. These are the control: which view an asset library is showing, which kinds of blueprint a
 * library is filtered to.
 *
 * Chips rather than a dropdown because the options are few and worth reading at a glance; a
 * dropdown hides four of five choices behind a click.
 *
 * @param {{
 *   options: Array<{value: string, label: string}>,
 *   value: string,
 *   onChange: (value: string) => void,
 *   label: string,
 *   children?: React.ReactNode
 * }} props - `children` sit at the end of the row, after the chips
 */
export default function FilterChipGroup({
  options,
  value,
  onChange,
  label,
  children,
}) {
  return (
    <Box
      role="group"
      aria-label={label}
      sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Chip
            key={option.value}
            label={option.label}
            color={selected ? "primary" : "default"}
            variant={selected ? "filled" : "outlined"}
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
          />
        );
      })}
      {children}
    </Box>
  );
}
