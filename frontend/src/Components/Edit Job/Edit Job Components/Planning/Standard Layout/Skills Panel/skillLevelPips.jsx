import { Box, Tooltip } from "@mui/material";
import { alpha } from "@mui/material/styles";

const LEVELS = [1, 2, 3, 4, 5];

/**
 * A skill's level as five marks rather than a number.
 *
 * "2 / 4" states the same thing, but a reader scanning a list of skills is
 * comparing shapes, not reading arithmetic — the shortfall is visible before the
 * figures are.
 *
 * The marks are also the control: clicking one asks what that level would be
 * worth, and clicking the level already trained puts the question back.
 *
 * @param {object} props
 * @param {number|null} props.level - The character's own level, null signed out
 * @param {number|null} [props.required] - What the blueprint asks for
 * @param {number|null} [props.proposed] - A level being tried
 * @param {(level: number|null) => void} [props.onPropose] - Omit to render marks
 *   that are not a control
 * @param {string} props.name - The skill, for the control's label
 */
export default function SkillLevelPips({
  level,
  required = null,
  proposed = null,
  onPropose,
  name,
}) {
  const trained = level ?? 0;
  const at = proposed ?? trained;

  // Keyed on the level being applied rather than the trained one, so lowering a
  // level shows as levels given up instead of showing nothing at all.
  const fillOf = (mark) => {
    if (mark <= at && mark <= trained) return "trained";
    if (mark <= at) return "proposed";
    if (mark <= trained) return "surrendered";
    // A mark the blueprint needs and the character does not have: the gap is
    // the point of the row.
    if (required !== null && mark <= required) return "short";
    return "empty";
  };

  const colourOf = (fill) =>
    ({
      trained: "success.main",
      proposed: "primary.main",
      // A level the character has but the question is asking them to do without.
      surrendered: (theme) => alpha(theme.palette.success.main, 0.25),
      short: (theme) => theme.palette.error.light,
      empty: "divider",
    })[fill];

  return (
    <Box sx={{ display: "inline-flex", gap: "2px", flexShrink: 0 }}>
      {LEVELS.map((mark) => {
        const fill = fillOf(mark);
        const pip = (
          <Box
            key={mark}
            component={onPropose ? "button" : "span"}
            type={onPropose ? "button" : undefined}
            aria-label={onPropose ? `${name} at level ${mark}` : undefined}
            data-fill={fill}
            onClick={
              onPropose
                ? (event) => {
                    event.stopPropagation();
                    onPropose(mark === at ? null : mark);
                  }
                : undefined
            }
            sx={{
              width: 7,
              height: 12,
              p: 0,
              border: 0,
              borderRadius: "1px",
              display: "block",
              bgcolor: colourOf(fill),
              cursor: onPropose ? "pointer" : "default",
            }}
          />
        );

        return onPropose ? (
          <Tooltip key={mark} title={`Try level ${mark}`} arrow>
            {pip}
          </Tooltip>
        ) : (
          pip
        );
      })}
    </Box>
  );
}
