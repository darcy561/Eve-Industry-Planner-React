import React, { useContext } from "react";
import {
  JobArrayContext,
  JobStatusContext,
  ActiveJobContext,
  JobSettingsTriggerContext,
  SelectedPageContext
} from "../../../Context/JobContext";
import { jobTypes } from "..";
import { JobSettingsButtons } from "./Edit Job Components/Job Settings Buttons";
import { EditPage1 } from "./Edit Job Components/Job Page 1";
import { EditPage2 } from "./Edit Job Components/Job Page 2";
import { EditPage3 } from "./Edit Job Components/Job Page 3";
import { EditPage4 } from "./Edit Job Components/Job Page 4";
import { EditPage5 } from "./Edit Job Components/Job Page 5";


//This is the function to render the contents of the edit job popup window
export function EditJob() {
  const [jobStatus, updateJobStatus] = useContext(JobStatusContext);
  const [jobArray, updateJobArray] = useContext(JobArrayContext);
  const [activeJob, updateActiveJob] = useContext(ActiveJobContext);
  const [JobSettingsTrigger, ToggleJobSettingsTrigger] = useContext(JobSettingsTriggerContext);
  const [SelectedPage, ChangeSelectedPage] = useContext(SelectedPageContext);


  function PageSelector() {
    if (SelectedPage === 1) {
      return <EditPage1 />;
    } else if (SelectedPage === 2) {
      return <EditPage2 />;
    } else if (SelectedPage === 3) {
      return <EditPage3 />
    } else if (SelectedPage === 4) {
      return <EditPage4 />
    } else if (SelectedPage === 5) {
      return <EditPage5 />
    }
  }


  if (JobSettingsTrigger) {
    return (
      <>
        <div id="jobSettings" className="jobSettings">
          <div id="jobSettingsHeader" className="jobSettingsHeader">
            <div className="jobSettingsHeaderButtons">
              {/* Delete Job Button */}
              <div
                className="deleteJob"
                onClick={() => {
                  const newArray = jobArray.filter(
                    (job) => job.jobID !== activeJob.jobID
                  );
                  updateJobArray(newArray);
                  ToggleJobSettingsTrigger((prev) => !prev);
                }}
              ></div>
              {/* close Job Button */}
              <div
                className="closeJob"
                onClick={() => {
                  const index = jobArray.findIndex(
                    (x) => activeJob.jobID === x.jobID
                  );
                  const newArray = [...jobArray];
                  newArray[index] = activeJob;
                  updateJobArray(newArray);
                  ToggleJobSettingsTrigger((prev) => !prev);
                  ChangeSelectedPage(activeJob.jobStatus);
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
                return activeJob.jobStatus === status.id ? (
                    <div key={status.id} className="jobNavButtonActive" onClick={()=>{ChangeSelectedPage(status.id)}}>
                    {status.name}
                  </div>
                ) : activeJob.jobType === jobTypes.manufacturing ? (
                    <div key={status.id} className="jobNavButtonM" onClick={() => { ChangeSelectedPage(status.id) }}>
                    {status.name}
                  </div>
                ) : activeJob.jobType === jobTypes.reaction ? (
                      <div key={status.id} className="jobNavButtonR" onClick={() => { ChangeSelectedPage(status.id) }}>
                    {status.name}
                  </div>
                ) : activeJob.jobType === jobTypes.pi ? (
                        <div key={status.id} className="jobNavButtonP" onClick={() => { ChangeSelectedPage(status.id) }}>
                    {status.name}
                  </div>
                ) : (
                  ""
                );
              })}
            </div>
          </div>
          <div id="jobSettingsContent" className="settingsWrapper">
              <PageSelector />
            {/* this calls the build of the buttons along the left hand side of the popup */}
            <JobSettingsButtons />
          </div>
        </div>
      </>
    );
  }
  return <></>;
}
