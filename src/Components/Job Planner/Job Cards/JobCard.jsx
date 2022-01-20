import { useContext } from "react";
import { ActiveJobContext } from "../../../Context/JobContext";
import { useFirebase } from "../../../Hooks/useFirebase";
import {
  LoadingTextContext,
  PageLoadContext,
} from "../../../Context/LayoutContext";
import ManJobCard from "./Job Cards/ManJobCard";
import ReacJobCard from "./Job Cards/ReacJobCard";

export function JobCard({
  job,
  updateJobSettingsTrigger,
  multiSelect,
  updateMultiSelect,
}) {
  const { updateActiveJob } = useContext(ActiveJobContext);
  const { downloadCharacterJobs } = useFirebase();
  const { updatePageLoad } = useContext(PageLoadContext);
  const { updateLoadingText } = useContext(LoadingTextContext);

  async function EditJobProcess(job) {
    updateLoadingText((prevObj) => ({
      ...prevObj,
      jobData: true,
    }));
    updatePageLoad(true);
    if (job.isSnapshot) {
      const jobEdit = await downloadCharacterJobs(job);
      job = jobEdit;
      job.isSnapshot = false;
    }
    updateActiveJob(job);
    updatePageLoad(false);
    updateLoadingText((prevObj) => ({
      ...prevObj,
      jobDataComp: true,
    }));
    updateJobSettingsTrigger((prev) => !prev);
    updateLoadingText((prevObj) => ({
      ...prevObj,
      jobData: false,
      jobDataComp: false,
    }));
    // This function sets up the correct job to be changed and displays the popup window.
  }

  if (job.jobType === 1) {
    return (
      <ManJobCard
        job={job}
        EditJobProcess={EditJobProcess}
        updateJobSettingsTrigger={updateJobSettingsTrigger}
        multiSelect={multiSelect}
        updateMultiSelect={updateMultiSelect}
      />
    );
  }
  if (job.jobType === 2) {
    return (
      <ReacJobCard
        job={job}
        EditJobProcess={EditJobProcess}
        updateJobSettingsTrigger={updateJobSettingsTrigger}
        multiSelect={multiSelect}
        updateMultiSelect={updateMultiSelect}
      />
    );
  }
}
