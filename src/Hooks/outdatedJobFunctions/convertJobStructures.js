// this function runs when new jobs are fetched and is used to convert the structure data on jobs to version 0.6.1

import { jobTypes } from "../../Context/defaultValues";
import { structureOptions } from "../../Context/defaultValues";

export function updateStructureValues(newJob) {
  const jobTypeOptions = {
    [jobTypes.manufacturing]: {
      structureOptions: structureOptions.manStructure,
      rigOptions: structureOptions.manRigs,
      systemOptions: structureOptions.manSystem,
    },
    [jobTypes.reaction]: {
      structureOptions: structureOptions.reactionStructure,
      rigOptions: structureOptions.reactionRigs,
      systemOptions: structureOptions.reactionSystem,
    },
  };

  if (newJob.structureTypeDisplay && jobTypeOptions[newJob.jobType]) {
    const { structureOptions, rigOptions, systemOptions } =
      jobTypeOptions[newJob.jobType];

    const findMatchingEntry = (options, prop, value) =>
      Object.values(options).find((i) => i[prop] === value);

    const matchedStructure = findMatchingEntry(
      structureOptions,
      "label",
      newJob.structureTypeDisplay
    );
    const matchedRig = findMatchingEntry(
      rigOptions,
      "material",
      newJob.rigType
    );
    const matchedSystem = findMatchingEntry(
      systemOptions,
      "value",
      newJob.systemType
    );

    newJob.structureType = matchedStructure?.id || 0;
    newJob.rigType = matchedRig?.id || 0;
    newJob.systemType = matchedSystem?.id || 0;

    delete newJob.structureTypeDisplay;
  }
}
