import React, { useCallback, useContext } from "react";
import {
  SnackBarDataContext,
  DialogDataContext,
  DataExchangeContext,
} from "../Context/LayoutContext";
import { JobArrayContext } from "../Context/JobContext";
import { IsLoggedInContext } from "../Context/AuthContext";
import { createJob } from "../Components/Job Planner/JobBuild";
import { CalculateTotals } from "./useBlueprintCalc";
import { useFirebase } from "./useFirebase";

export function useCreateJobProcess() {
  const { jobArray, updateJobArray } = useContext(JobArrayContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { updateDialogData } = useContext(DialogDataContext);
  const { updateDataExchange } = useContext(DataExchangeContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { addNewJob } = useFirebase();

  console.log(isLoggedIn);

  const newJobProcess = useCallback(async (itemID, itemQty) => {

    console.log(isLoggedIn);

    if (isLoggedIn === false && jobArray.length >= 8) {
      updateDialogData((prev) => ({
        ...prev,
        buttonText: "Close",
        id: "Max-Jobs-Exceeded",
        open: true,
        title: "Job Count Exceeded",
        body: "You have exceeded the maximum number of jobs you can create as an unregistered user. Sign into your Eve Account to create more. Jobs that have been created without registering will be lost upon leaving/refreshing the page.",
      }));
    } else if (isLoggedIn && jobArray.length >= 100) {
      updateDialogData((prev) => ({
        ...prev,
        buttonText: "Close",
        id: "Max-Jobs-Exceeded",
        open: true,
        title: "Job Count Exceeded",
        body: "You currently cannot create more than 100 individual job cards. Remove existing job cards to add more.",
      }));
    } else {
      updateDataExchange(true);
      
      const newJob = await createJob(itemID);

      if (newJob === "TypeError") {
        setSnackbarData((prev) => ({
          ...prev,
          open: true,
          message: "No blueprint found for this item",
          severity: "error",
          autoHideDuration: 2000,
        }));
        updateDataExchange(false);
      } else if (newJob === "objectError") {
        setSnackbarData((prev) => ({
          ...prev,
          open: true,
          message: "Error building job object, please try again",
          severity: "error",
          autoHideDuration: 2000,
        }));
        updateDataExchange(false);
      } else if (newJob.jobType === 3) {
        setSnackbarData((prev) => ({
          ...prev,
          open: true,
          message: "Unable to add Planetary Interation materials at this time",
          severity: "error",
          autoHideDuration: 3000,
        }));
        updateDataExchange(false);
      } else {
        
        if (itemQty != null) {
          switch (newJob.jobType) {
            case 1:
              newJob.jobCount = Math.ceil(
                itemQty /
                  (newJob.maxProductionLimit *
                    newJob.manufacturing.products[0].quantity)
              );
              newJob.runCount = Math.ceil(
                itemQty /
                  newJob.manufacturing.products[0].quantity /
                  newJob.jobCount
              );
              break;
            case 2:
              newJob.jobCount = Math.ceil(
                itemQty /
                  (newJob.maxProductionLimit *
                    newJob.reaction.products[0].quantity)
              );
              newJob.runCount = Math.ceil(
                itemQty / newJob.reaction.products[0].quantity / newJob.jobCount
              );
              break;
          };
        };
        
        const calculatedValue = CalculateTotals(newJob);
        newJob.job.materials = calculatedValue;
        console.log(isLoggedIn);
        
        isLoggedIn && addNewJob(newJob);
        
        updateJobArray((prevArray) => [...prevArray, newJob]);
        
        updateDataExchange(false);
        setSnackbarData((prev) => ({
          ...prev,
          open: true,
          message: `${newJob.name} Added`,
          severity: "success",
          autoHideDuration: 3000,
        }));
      };
    };
  }, []);
  return { newJobProcess };
};
