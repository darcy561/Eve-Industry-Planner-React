import React, { useContext } from "react";
import { JobArrayContext, ActiveJobContext, JobSettingsTriggerContext, SelectedPageContext } from "../../../Context/JobContext";
import { jobTypes } from "..";

//job addings the material efficiency and time efficiency rows onto the job card if the jobype is manufacturing
function AddManufacturingData(job) {
  if (job.job.jobType !== jobTypes.manufacturing) {
    return (<></>);
  };
  if (job.job.jobType === jobTypes.manufacturing) {
    return (
      <>
        <div className="jobBodyTextRow">
          <div>Material Efficiency</div>
          <div>{job.job.bpME}</div>
        </div>
        <div className="jobBodyTextRow">
          <div>Time Efficiency</div>
          <div>{job.job.bpTE}</div>
        </div>
      </>
    );
  };
};

//Adds the coloured bar at the base of a job card and switches based on the jobtype
function SwitchJobTypeStyle(job) {
  if (job.job.jobType === jobTypes.manufacturing) {
    return (
      <div className="jobTypeBarM">
        <div className="jobTypeBarText">Manufacturing</div>
      </div>
    );
  };
  if (job.job.jobType === jobTypes.reaction) {
    return (
      <div className="jobTypeBarR">
        <div className="jobTypeBarText">Reaction</div>
      </div>
    );
  };
  if (job.job.jobType === jobTypes.pi) {
    return (
      <div className="jobTypeBarP">
        <div className="jobTypeBarText">Planetary Interaction</div>
      </div>
    );
  };
};

// builds a single job card for each job in the job array, This is displayed on the job planner page. Called from jobplanner.jsx
function JobCard(props) {
  const [jobArray, updateJobArray] = useContext(JobArrayContext);
  const [activeJob, updateActiveJob] = useContext(ActiveJobContext);
  const [JobSettingsTrigger, ToggleJobSettingsTrigger] = useContext(JobSettingsTriggerContext);
  const [SelectedPage, ChangeSelectedPage] = useContext(SelectedPageContext);

  const jobList = jobArray.filter((job) => job.jobStatus === props.id);

  function EditJobProcess(job) {
    ChangeSelectedPage(job.jobStatus);
    updateActiveJob(job);
    ToggleJobSettingsTrigger(prev =>!prev);
    // This function sets up the correct job to be changed and displays the popup window.
  };

  return jobList.map((job) => {
    return (
      <>
        <div key={job.jobID} className="jobItem">
          <div className="jobOverlay" onClick={()=>EditJobProcess(job)}></div>
          <div className="jobName">
            <div>
              <h3>{job.name}</h3>
            </div>
          </div>
          <div className="jobBodyWrapper">
            <div className="jobImage">
              <img src={`../../../images/items/${job.iconID}.png`} alt="" />
            </div>
            <div className="jobBodyTextWrapper">
              <div className="jobBodyTextRow">
                <div>Run Count</div>
                <div>{job.runCount}</div>
              </div>
              <div className="jobBodyTextRow">
                <div>Job Count</div>
                <div>{job.jobCount}</div>
              </div>
              {<AddManufacturingData job={job} />}
            </div>
          </div>
          {<SwitchJobTypeStyle job={job} />}
        </div>
      </>
    );
  });
};

export { JobCard };