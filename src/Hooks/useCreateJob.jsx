import { useContext } from "react";
import {
  SnackBarDataContext,
  DialogDataContext,
  DataExchangeContext,
} from "../Context/LayoutContext";
import {UsersContext} from "../Context/AuthContext"
import { JobArrayContext } from "../Context/JobContext";
import { IsLoggedInContext } from "../Context/AuthContext";
import { createJob } from "../Components/Job Planner/JobBuild";
import { useBlueprintCalc } from "./useBlueprintCalc";
import { useFirebase } from "./useFirebase";
import { trace } from "@firebase/performance";
import { performance } from "../firebase";

export function useCreateJobProcess() {
  const { jobArray, updateJobArray } = useContext(JobArrayContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { updateDialogData } = useContext(DialogDataContext);
  const { updateDataExchange } = useContext(DataExchangeContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const {users} = useContext(UsersContext)
  const { addNewJob } = useFirebase();
  const { CalculateResources } = useBlueprintCalc();

  const parentUser = users.find((i)=> i.ParentUser === true)

  const newJobProcess = async (itemID, itemQty) => {
    const t = trace(performance, "CreateJobProcessFull");
    t.start();

    if (isLoggedIn === false && jobArray.length >= 8) {
      updateDialogData((prev) => ({
        ...prev,
        buttonText: "Close",
        id: "Max-Jobs-Exceeded",
        open: true,
        title: "Job Count Exceeded",
        body: "You have exceeded the maximum number of jobs you can create as an unregistered user. Sign into your Eve Account to create more. Jobs that have been created without registering will be lost upon leaving/refreshing the page.",
      }));
      t.putAttribute("JobArraySizeFull", "Not Logged In");
      t.incrementMetric("Max Jobs Reached - Not Logged In", 1);
    } else if (isLoggedIn && jobArray.length >= 100) {
      updateDialogData((prev) => ({
        ...prev,
        buttonText: "Close",
        id: "Max-Jobs-Exceeded",
        open: true,
        title: "Job Count Exceeded",
        body: "You currently cannot create more than 100 individual job cards. Remove existing job cards to add more.",
      }));
      t.putAttribute("JobArraySizeFull", "Logged In");
      t.incrementMetric("Max Jobs Reached - Logged In", 1);

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
        t.putAttribute("FailedJobCreation", "No BP Found");
        t.incrementMetric("No Bp Found", 1);
        t.incrementMetric("Items with no BP", 1);

      } else if (newJob === "objectError") {
        setSnackbarData((prev) => ({
          ...prev,
          open: true,
          message: "Error building job object, please try again",
          severity: "error",
          autoHideDuration: 2000,
        }));
        updateDataExchange(false);
        t.putAttribute("FailedJobCreation", "Error Building Job");
        t.incrementMetric("Error building Job", 1);

      } else if (newJob.jobType === 3) {
        setSnackbarData((prev) => ({
          ...prev,
          open: true,
          message: "Unable to add Planetary Interation materials at this time",
          severity: "error",
          autoHideDuration: 3000,
        }));
        updateDataExchange(false);
        t.putAttribute("FailedJobCreation", "Added PI Job");
        t.incrementMetric("Unable to Add PI Job", 1);

      } else {
        t.putAttribute("CompleteJobCreation", "Basic Item");
        if (itemQty != null) {
              newJob.jobCount = Math.ceil(
                itemQty /
                  (newJob.maxProductionLimit *
                    newJob.rawData.products[0].quantity)
              );
              newJob.runCount = Math.ceil(
                itemQty /
                  newJob.rawData.products[0].quantity /
                  newJob.jobCount
              );
        }

        const calculatedJob = CalculateResources(newJob)
        
        if (isLoggedIn) {
          isLoggedIn && addNewJob(calculatedJob);
          calculatedJob.build.buildChar = parentUser.CharacterHash;
        }

        updateJobArray((prevArray) => [...prevArray, calculatedJob]);
        updateDataExchange(false);
        setSnackbarData((prev) => ({
          ...prev,
          open: true,
          message: `${calculatedJob.name} Added`,
          severity: "success",
          autoHideDuration: 3000,
        }));
        t.removeAttribute("CompleteJobCreation");
        t.putAttribute("CompleteJobCreation", "Calculated Item");
      }
      t.incrementMetric("Complete", 1);
      t.stop();
    }
  };
  return { newJobProcess };
}
