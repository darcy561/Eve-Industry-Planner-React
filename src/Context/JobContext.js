import React, { useState, createContext } from "react";

export const JobStatusContext = createContext();

export const JobStatus = (props) => {
  const [jobStatus, setJobStatus] = useState([
    { id: 0, name: "Planning", sortOrder: 0,  expanded: true, openAPIJobs: false, completeAPIJobs: false },
    { id: 1, name: "Purchasing", sortOrder: 1, expanded: true, openAPIJobs: false, completeAPIJobs: false },
    { id: 2, name: "Building", sortOrder: 2, expanded: true, openAPIJobs: true, completeAPIJobs: false },
    { id: 3, name: "Complete", sortOrder: 3, expanded: true, openAPIJobs: false, completeAPIJobs: true},
    { id: 4, name: "For Sale", sortOrder: 4, expanded: true, openAPIJobs: false, completeAPIJobs: false}
  ]);

  return (
    <JobStatusContext.Provider value={{ jobStatus, setJobStatus }}>
      {props.children}
    </JobStatusContext.Provider>
  );
};

export const JobArrayContext = createContext();

export const JobArray = (props) => {
  const [jobArray, updateJobArray] = useState([]);

  return (
    <JobArrayContext.Provider value={{jobArray, updateJobArray}}>
      {props.children}
    </JobArrayContext.Provider>
  );
};


export const ActiveJobContext = createContext();

export const ActiveJob = (props) => {
  const [activeJob, updateActiveJob] = useState({});
  
  return (
    <ActiveJobContext.Provider value={{ activeJob, updateActiveJob }}>
      {props.children}
    </ActiveJobContext.Provider>
  );
};


export const JobSettingsTriggerContext = createContext();

export const JobSettingsTrigger = (props) => {
  const [JobSettingsTrigger, ToggleJobSettingsTrigger] = useState(false);

  return (
    <JobSettingsTriggerContext.Provider value={{ JobSettingsTrigger, ToggleJobSettingsTrigger }}>
      {props.children}
    </JobSettingsTriggerContext.Provider>
  );
};