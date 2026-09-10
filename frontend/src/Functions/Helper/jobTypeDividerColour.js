import { jobTypes } from "../../Context/defaultValues";

/**
 * Returns a theme palette color string for visual accents (e.g. dividers, chips) by job type.
 * Uses the same industry colors as elsewhere (manufacturing, reaction, PI, base material).
 * Unknown or missing job types fall back to `theme.palette.primary.main` (not divider), so this
 * helper stays suitable for general UI accents.
 *
 * The industry colours are the app theme's own additions, so a theme without
 * them falls back rather than throwing: an accent is decoration, and losing one
 * should not take down whatever was being decorated.
 *
 * @param {object} theme - MUI theme
 * @param {number | undefined | null} jobType
 * @returns {string}
 */
export function getJobTypeAccentColour(theme, jobType) {
  const fallback = theme?.palette?.primary?.main ?? "currentColor";
  const accent = (name) => theme?.palette?.[name]?.main ?? fallback;

  switch (jobType) {
    case jobTypes.manufacturing:
      return accent("manufacturing");
    case jobTypes.reaction:
      return accent("reaction");
    case jobTypes.pi:
      return accent("pi");
    case jobTypes.baseMaterial:
      return accent("baseMat");
    case jobTypes.invention:
      return accent("warning");
    default:
      return fallback;
  }
}
