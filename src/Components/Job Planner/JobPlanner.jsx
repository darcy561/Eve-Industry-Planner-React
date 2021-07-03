import React, { useContext } from "react";
import { SearchPlanner } from "../Search";
import { JobCard } from "./Job Card";
import { JobStatusContext} from "../../Context/JobContext";
import { EditJob } from "./Job Card/EditJob";

let blueprintVariables = {
  me: [
    { value: 0, display: 0 },
    { value: 1, display: 1 },
    { value: 2, display: 2 },
    { value: 3, display: 3 },
    { value: 4, display: 4 },
    { value: 5, display: 5 },
    { value: 6, display: 6 },
    { value: 7, display: 7 },
    { value: 8, display: 8 },
    { value: 9, display: 9 },
    { value: 10, display: 10 },
  ],
  te: [
    { value: 0, display: 0 },
    { value: 1, display: 1 },
    { value: 2, display: 2 },
    { value: 3, display: 3 },
    { value: 4, display: 4 },
    { value: 5, display: 5 },
    { value: 6, display: 6 },
    { value: 7, display: 7 },
    { value: 8, display: 8 },
    { value: 9, display: 9 },
    { value: 10, display: 10 },
  ],
  manStructure: [
    { value: 1, display: "Medium" },
    { value: 1, display: "Large" },
    { value: 1, display: "X-Large" },
  ],
  manRigs: [
    { value: 0, display: "None" },
    { value: 2.0, display: "Tech 1" },
    { value: 2.4, display: "Tech 2" },
  ],
  manSystem: [
    { value: 1, display: "High Sec" },
    { value: 1.9, display: "Low Sec" },
    { value: 2.1, display: "Null Sec / WH" },
  ],
  reactionSystem: [
    { value: 1, display: "Low Sec" },
    { value: 1.1, display: "Null Sec / WH" },
  ],
  reactionStructure: [
    { value: "Medium", display: "Medium" },
    { value: "Large", display: "Large" },
  ],
  reactionRigs: [
    { value: 0, display: "None" },
    { value: 2.0, display: "Tech 1" },
    { value: 2.4, display: "Tech 2" },
  ],
};

let jobTypes = {
  baseMaterial: 0,
  manufacturing: 1,
  reaction: 2,
  pi: 3,
};

function JobStatusRows() {
  const [jobStatus] = useContext(JobStatusContext);
  

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
