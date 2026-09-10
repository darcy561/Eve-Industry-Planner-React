import { jobTypes } from "../../Context/defaultValues";

/**
 * The filters the blueprint library offers.
 *
 * @type {Readonly<Record<string, string>>}
 */
export const LIBRARY_FILTER = Object.freeze({
  ALL: "all",
  ACTIVE: "active",
  MANUFACTURING: "manufacturing",
  REACTIONS: "reactions",
  BPO: "bpo",
  BPC: "bpc",
});

/**
 * Narrows the library to the filter in the URL.
 *
 * Every test here is an equality check against a field the row already carries. Four of these used
 * to scan the whole search index once per blueprint to decide what a row builds, which is a join
 * the collection performs once when it is built.
 *
 * @param {Array<import("./buildBlueprintRows").BlueprintRow>} rows
 * @param {string} filter - see {@link LIBRARY_FILTER}
 * @param {Array<Object>} [industryJobs] - for the active filter
 * @returns {Array<import("./buildBlueprintRows").BlueprintRow>}
 */
export default function filterLibraryBlueprints(rows, filter, industryJobs = []) {
  switch (filter) {
    case LIBRARY_FILTER.ACTIVE: {
      const running = new Set(
        industryJobs
          .filter((job) => job.status === "active")
          .map((job) => job.blueprint_id)
      );
      return running.size === 0
        ? []
        : rows.filter((row) => running.has(row.itemId));
    }

    case LIBRARY_FILTER.MANUFACTURING:
      return rows.filter((row) => row.jobType === jobTypes.manufacturing);

    case LIBRARY_FILTER.REACTIONS:
      return rows.filter((row) => row.jobType === jobTypes.reaction);

    case LIBRARY_FILTER.BPO:
      return rows.filter(
        (row) => !row.isCopy && row.jobType === jobTypes.manufacturing
      );

    case LIBRARY_FILTER.BPC:
      return rows.filter(
        (row) => row.isCopy && row.jobType === jobTypes.manufacturing
      );

    default:
      return rows;
  }
}
