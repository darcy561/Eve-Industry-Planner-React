import { Box, Stack, Typography } from "@mui/material";

import {
  FigureCaption,
  FigureRow,
} from "../../../../../../Styled Components/Typography/figures";
import { formatTimeDuration } from "../../../../../../Functions/Helper/numberParser";
import { timeForSetup } from "../../../../../../Functions/Blueprint Calculations/calculateTimeForSetup";
import Superseded from "./superseded";

/**
 * How long the job takes, and what the levels being tried would do to it.
 *
 * Every required skill takes 1% a level off, and Industry, Advanced Industry or
 * Reaction come off the whole job — so raising one is a change a player can see
 * without it touching a single ISK figure. Without this the industry skills were
 * the only rows on the panel that could be tried and produce no answer.
 *
 * @param {object} props
 * @param {object} props.setup - The selected setup
 * @param {Array<{typeID: number, level: number}>} props.jobSkills
 * @param {object|null} props.characterSkills - Keyed by type id
 * @param {Object<number, number>} props.proposed - Levels being tried
 */
export default function SkillsTimeEffect({
  setup,
  jobSkills,
  characterSkills,
  proposed,
}) {
  const now = timeForSetup(setup, jobSkills, characterSkills ?? {});
  if (!Number.isFinite(now)) return null;

  // The proposal read as a skills map, so the same calculation answers both.
  const asked = { ...(characterSkills ?? {}) };
  for (const [typeID, activeLevel] of Object.entries(proposed)) {
    asked[typeID] = {
      ...(asked[typeID] ?? {}),
      id: Number(typeID),
      activeLevel,
    };
  }
  const then = timeForSetup(setup, jobSkills, asked);

  const changed = Number.isFinite(then) && then !== now;

  return (
    <Box>
      <FigureCaption>How long it takes</FigureCaption>
      <Stack sx={{ mt: 0.5 }}>
        <FigureRow
          label="Job time"
          // Always says something: a line that appears only once a level is
          // tried grows the panel underneath the control being clicked.
          sublabel={changed ? sublabelFor(now, then) : "at your current levels"}
          value={
            <Superseded
              was={formatTimeDuration(now)}
              is={formatTimeDuration(then)}
              changed={changed}
            />
          }
        />
      </Stack>
    </Box>
  );
}

/**
 * @param {number} now
 * @param {number} then
 */
function sublabelFor(now, then) {
  const saved = now - then;
  const verb = saved > 0 ? "shorter" : "longer";
  return `${formatTimeDuration(Math.abs(saved))} ${verb}`;
}
