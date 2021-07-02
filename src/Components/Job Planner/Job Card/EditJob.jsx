import React, { useContext } from "react";
import {
  JobArrayContext,
  JobStatusContext,
  ActiveJobContext,
  JobSettingsTriggerContext,
} from "../../../Context/JobContext";
import JobStatusSelect from "./Edit Job Components/Job Status Nav";
import { JobSettingsButtons } from "./Edit Job Components/Job Settings Buttons";

export function EditJob() {
  const [jobStatus, updateJobStatus] = useContext(JobStatusContext);
  const [jobArray, updateJobArray] = useContext(JobArrayContext);
  const [activeJob, updateActiveJob] = useContext(ActiveJobContext);
  const [JobSettingsTrigger, ToggleJobSettingsTrigger] = useContext(
    JobSettingsTriggerContext
  );

  if (JobSettingsTrigger) {
    return (
      <>
        <div id="jobSettings" className="jobSettings">
          <div id="jobSettingsHeader" className="jobSettingsHeader">
            <div className="jobSettingsHeaderButtons">
              <div
                className="deleteJob"
                onClick={() => {
                  const newArray = jobArray.filter(
                    (job) => job.jobID !== activeJob.jobID
                  );
                  updateJobArray(newArray);
                  ToggleJobSettingsTrigger(!JobSettingsTrigger);
                }}
              ></div>
              <div
                className="closeJob"
                onClick={() => {
                  ToggleJobSettingsTrigger(!JobSettingsTrigger);
                }}
              >
                X
              </div>
            </div>
            <div className="settingsName">
              <h2>{activeJob.name}</h2>
            </div>
            <div className="jobNav">
              {jobStatus.map((status) => {
                return <JobStatusSelect status={status} />;
              })}
            </div>
          </div>
          <div id="jobSettingsContent" className="settingsWrapper">
            <div className="settingsOptionWrapper">

            </div>
            {activeJob.jobStatus}
            <JobSettingsButtons />
          </div>
        </div>
      </>
    );
  }
  return <></>;
}
