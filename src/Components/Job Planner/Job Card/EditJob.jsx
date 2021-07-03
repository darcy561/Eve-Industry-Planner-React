import React, { useContext } from "react";
import {
  JobArrayContext,
  JobStatusContext,
  ActiveJobContext,
  JobSettingsTriggerContext,
} from "../../../Context/JobContext";
import JobStatusSelect from "./Edit Job Components/Job Status Nav";
import { JobSettingsButtons } from "./Edit Job Components/Job Settings Buttons";

//This is the function to render the contents of the edit job popup window
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
              {/* this calls the build of the nav bar  */}
              {jobStatus.map((status) => {
                return <JobStatusSelect status={status} />;
              })}
            </div>
          </div>
          <div id="jobSettingsContent" className="settingsWrapper">
            <div className="settingsOptionWrapper">

            </div>
            {/* this calls the build of the buttons along the left hand side of the popup */}
            <JobSettingsButtons />
          </div>
        </div>
      </>
    );
  }
  return <></>;
}
