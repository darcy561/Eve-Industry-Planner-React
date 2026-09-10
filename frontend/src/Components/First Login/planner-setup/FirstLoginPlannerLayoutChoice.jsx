import { Stack } from "@mui/material";
import SelectableCard from "../../../Styled Components/Paper/SelectableCard";

/**
 * Mutually exclusive classic vs compact planner layout (checkbox-style rows).
 */
export function FirstLoginPlannerLayoutChoice({
  compact,
  onSelectClassic,
  onSelectCompact,
}) {
  return (
    <Stack
      component="fieldset"
      spacing={1.5}
      sx={{ border: "none", m: 0, p: 0 }}
      role="radiogroup"
      aria-label="Planner card layout"
    >
      <SelectableCard
        selected={!compact}
        onSelect={onSelectClassic}
        title="Classic cards"
      />
      <SelectableCard
        selected={compact}
        onSelect={onSelectCompact}
        title="Compact cards"
      />
    </Stack>
  );
}
