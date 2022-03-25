import Step1JobCard from "./Job Cards/step1";
import Step2JobCard from "./Job Cards/step2";
import Step3JobCard from "./Job Cards/step3";
import Step4JobCard from "./Job Cards/step4";
import Step5JobCard from "./Job Cards/step5";

export function JobCard({
  job,
  updateJobSettingsTrigger,
  multiSelect,
  updateMultiSelect,
}) {
  if (job.jobStatus === 0) {
    return (
      <Step1JobCard
        job={job}
        updateJobSettingsTrigger={updateJobSettingsTrigger}
      />
    );
  } else if (job.jobStatus === 1) {
    return (
      <Step2JobCard
        job={job}
        updateJobSettingsTrigger={updateJobSettingsTrigger}
      />
    );
  } else if (job.jobStatus === 2) {
    return (
      <Step3JobCard
        job={job}
        updateJobSettingsTrigger={updateJobSettingsTrigger}
      />
    );
  } else if (job.jobStatus === 3) {
    return (
      <Step4JobCard
        job={job}
        updateJobSettingsTrigger={updateJobSettingsTrigger}
      />
    );
  } else if (job.jobStatus === 4) {
    return (
      <Step5JobCard
        job={job}
        updateJobSettingsTrigger={updateJobSettingsTrigger}
      />
    );
  }
}
