import React, { useState, createContext } from "react";

export const JobStatusContext = createContext();

export const JobStatus = (props) => {
  const [jobStatus, setJobStatus] = useState([
    { id: 1, name: "Planning" },
    { id: 2, name: "Purchasing" },
    { id: 3, name: "Building" },
    { id: 4, name: "Complete" },
    { id: 5, name: "For Sale" }
  ]);

  return (
    <JobStatusContext.Provider value={[jobStatus, setJobStatus]}>
      {props.children}
    </JobStatusContext.Provider>
  );
};

export const JobArrayContext = createContext();

export const JobArray = (props) => {
  const [jobArray, updateJobArray] = useState([]);

  return (
    <JobArrayContext.Provider value={[jobArray, updateJobArray]}>
      {props.children}
    </JobArrayContext.Provider>
  );
};


export const ActiveJobContext = createContext();

export const ActiveJob = (props) => {
  const [activeJob, updateActiveJob] = useState({});
  
  return (
    <ActiveJobContext.Provider value={[activeJob, updateActiveJob]}>
      {props.children}
    </ActiveJobContext.Provider>
  );
};


export const JobSettingsTriggerContext = createContext();

export const JobSettingsTrigger = (props) => {
  const [JobSettingsTrigger, ToggleJobSettingsTrigger] = useState(false);

  return (
    <JobSettingsTriggerContext.Provider value={[JobSettingsTrigger, ToggleJobSettingsTrigger]}>
      {props.children}
    </JobSettingsTriggerContext.Provider>
  );
};

export const SelectedPageContext = createContext();

export const SelectedPage = (props) => {
  const [SelectedPage, ChangeSelectedPage] = useState(null);

  return (
    <SelectedPageContext.Provider value={[SelectedPage, ChangeSelectedPage]}>
      {props.children}
    </SelectedPageContext.Provider>
  );
};