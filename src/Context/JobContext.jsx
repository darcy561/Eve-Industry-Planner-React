import React, { useState, createContext } from "react";
import {
  apiJobsDefault,
  jobArrayDefault,
  jobStatusDefault,
} from "./defaultValues";

export const JobStatusContext = createContext();

export const JobStatus = (props) => {
  const [jobStatus, setJobStatus] = useState(jobStatusDefault);

  return (
    <JobStatusContext.Provider value={{ jobStatus, setJobStatus }}>
      {props.children}
    </JobStatusContext.Provider>
  );
};

export const JobArrayContext = createContext();

export const JobArray = (props) => {
  const [jobArray, updateJobArray] = useState(jobArrayDefault);

  return (
    <JobArrayContext.Provider value={{ jobArray, updateJobArray }}>
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

export const ApiJobsContext = createContext();

export const ApiJobs = (props) => {
  const [apiJobs, updateApiJobs] = useState(apiJobsDefault);

  return (
    <ApiJobsContext.Provider value={{ apiJobs, updateApiJobs }}>
      {props.children}
    </ApiJobsContext.Provider>
  );
};

export const ArchivedJobsContext = createContext();

export const ArchivedJobs = (props) => {
  const [archivedJobs, updateArchivedJobs] = useState([]);

  return (
    <ArchivedJobsContext.Provider value={{ archivedJobs, updateArchivedJobs }}>
      {props.children}
    </ArchivedJobsContext.Provider>
  );
};

export const LinkedIDsContext = createContext();

export const LinkedIDs = (props) => {
  const [linkedOrderIDs, updateLinkedOrderIDs] = useState([]);
  const [linkedJobIDs, updateLinkedJobIDs] = useState([]);
  const [linkedTransIDs, updateLinkedTransIDs] = useState([]);

  return (
    <LinkedIDsContext.Provider
      value={{
        linkedJobIDs,
        updateLinkedJobIDs,
        linkedOrderIDs,
        updateLinkedOrderIDs,
        linkedTransIDs,
        updateLinkedTransIDs
      }}
    >
      {props.children}
    </LinkedIDsContext.Provider>
  );
};
