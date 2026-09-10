/**
 * The colour a blueprint card is edged in, which says at a glance what is happening to it.
 *
 * Idle, it distinguishes an original from a copy. Building, it warns — and a copy whose remaining
 * runs the job will use up is marked as expiring rather than merely in use, because it will not
 * survive the job.
 *
 * @param {Object|null} esiJob - the active job on this blueprint, if there is one
 * @param {boolean} isCopy
 * @param {number} runs
 * @returns {(theme: import("@mui/material/styles").Theme) => string}
 */
export function blueprintAccentColor(esiJob, isCopy, runs) {
  if (!esiJob) {
    return (theme) =>
      isCopy ? theme.palette.primary.light : theme.palette.primary.main;
  }

  if (isCopy && runs <= esiJob.runs) {
    return (theme) => theme.palette.error.main;
  }

  return (theme) => theme.palette.warning.main;
}
