import React, { useContext, useState } from "react";
import { SearchPlanner } from "../Search";
import { JobCard } from "./Job Card";
import { JobStatusContext, JobSettingsTriggerContext } from "../../Context/JobContext";
import { EditJob } from "./Edit Job/EditJob";

let blueprintVariables = {
  me: [
    { value: 0, label: 0 },
    { value: 1, label: 1 },
    { value: 2, label: 2 },
    { value: 3, label: 3 },
    { value: 4, label: 4 },
    { value: 5, label: 5 },
    { value: 6, label: 6 },
    { value: 7, label: 7 },
    { value: 8, label: 8 },
    { value: 9, label: 9 },
    { value: 10, label: 10 },
  ],
  te: [
    { value: 0, label: 0 },
    { value: 1, label: 1 },
    { value: 2, label: 2 },
    { value: 3, label: 3 },
    { value: 4, label: 4 },
    { value: 5, label: 5 },
    { value: 6, label: 6 },
    { value: 7, label: 7 },
    { value: 8, label: 8 },
    { value: 9, label: 9 },
    { value: 10, label: 10 },
  ],
  manStructure: [
    { value: "Medium", label: "Medium" },
    { value: "Large", label: "Large" },
    { value: "X-Large", label: "X-Large" },
  ],
  manRigs: [
    { value: 0, label: "None" },
    { value: 2.0, label: "Tech 1" },
    { value: 2.4, label: "Tech 2" },
  ],
  manSystem: [
    { value: 1, label: "High Sec" },
    { value: 1.9, label: "Low Sec" },
    { value: 2.1, label: "Null Sec / WH" },
  ],
  reactionSystem: [
    { value: 1, label: "Low Sec" },
    { value: 1.1, label: "Null Sec / WH" },
  ],
  reactionStructure: [
    { value: "Medium", label: "Medium" },
    { value: "Large", label: "Large" },
  ],
  reactionRigs: [
    { value: 0, label: "None" },
    { value: 2.0, label: "Tech 1" },
    { value: 2.4, label: "Tech 2" },
  ],
};

let jobTypes = {
  baseMaterial: 0,
  manufacturing: 1,
  reaction: 2,
  pi: 3,
};

function JobStatusRows() {
  const [jobStatus, setJobStatus] = useContext(JobStatusContext);
  

  return jobStatus.map((s) => {
    return (
      <>
        <div key={s.id} className="statusWrapper">
          <div className="statusName">
            <h2>{s.name}</h2>
          </div>
          <div className="jobGrid">
            <JobCard key={s.id} id={s.id} />
          </div>
        </div>
      </>
    );
  });
};

function JobPlanner() {

  const [JobSettingsTrigger, ToggleJobSettingsTrigger] = useContext(JobSettingsTriggerContext);

  return (
    <>
      <SearchPlanner />
      <section className="block-section">
        {/* Rendes the job edit popup window */}
          <EditJob JobSettingsTrigger={true} />
        <div id="jobWrapper" className="jobsWrapper">
        {/* Builds each status section on the job planner main page */}
          <JobStatusRows /> 
        </div>
      </section>
    </>
  );
};

export { JobPlanner, JobStatusRows, blueprintVariables, jobTypes };
