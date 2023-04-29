import { useContext } from "react";
import { ActiveJobContext, JobArrayContext } from "../../Context/JobContext";
import { useFindJobObject } from "../GeneralHooks/useFindJobObject";
import { UserJobSnapshotContext } from "../../Context/AuthContext";
import { jobTypes } from "../../Context/defaultValues";
import ka from "date-fns/locale/ka/index";

export function useBuildChildJobs() {
  const { jobArray, groupArray } = useContext(JobArrayContext);
  const { activeGroup } = useContext(ActiveJobContext);
  const { userJobSnapshot } = useContext(UserJobSnapshotContext);
  const { findJobData } = useFindJobObject();

  const calculateExistingTypeIDs = async () => {
    const result = [];

    for (const jobID of activeGroup.includedJobIDs) {
      const job = await findJobData(
        jobID,
        userJobSnapshot,
        jobArray,
        groupArray,
        "groupJob"
      );

      if (!job) {
        continue;
      }

      const childJobData = job.build.materials.reduce((output, material) => {
        if (
          material.jobType === jobTypes.manufacturing ||
          material.jobType === jobTypes.reaction
        ) {
          output.push({
            itemID: material.typeID,
            name: material.name,
            childJobIDs: new Set(material.childJob),
          });
        }

        return output;
      }, []);

      result.push({
        name: job.name,
        jobID: job.jobID,
        itemID: job.itemID,
        itemQty: job.build.products.totalQuantity,
        parentJobIDs: new Set(job.parentJob),
        childJobs: childJobData,
      });
    }

    return result;
  };

  const calculateNeededJobs = async (requestedJobIDs, existingTypeIDData) => {
    const result = [];
    for (const inputJobID of requestedJobIDs) {
      const requestedJob = await findJobData(
        inputJobID,
        userJobSnapshot,
        jobArray,
        groupArray,
        "groupJob"
      );
      if (!requestedJob) {
        continue;
      }
      const typeIDsToModify = requestedJob.build.materials.reduce(
        (output, material) => {
          if (
            material.childJob.length === 0 &&
            material.jobType === jobTypes.manufacturing &&
            material.jobType === jobTypes.reaction &&
            existingTypeIDData.some((i) => i.itemID === material.typeID)
          ) {
            
          }
        },
        []
      );
    }
  };
}
