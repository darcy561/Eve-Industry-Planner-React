import ManJobCard from "./Job Cards/ManJobCard";
import ReacJobCard from "./Job Cards/ReacJobCard";

export function JobCard({
  job,
  updateJobSettingsTrigger,
  multiSelect,
  updateMultiSelect,
}) {

  if (job.jobType === 1) {
    return (
      <ManJobCard
        job={job}
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
        updateJobSettingsTrigger={updateJobSettingsTrigger}
        multiSelect={multiSelect}
        updateMultiSelect={updateMultiSelect}
      />
    );
  }
}
