import React, { useContext, useState } from "react";
import { jobTypes } from "../..";
import { ActiveJobContext } from "../../../../Context/JobContext";

function JobStatusSelect(status) {
  const [activeJob, updateActiveJob] = useContext(ActiveJobContext);

  if (activeJob.jobType === jobTypes.manufacturing) {
    return (
      <>
        <div
          key={status.status.id}
        className={`${activeJob.jobStatus === status.status.id ? `jobNavButtonActive`:`jobNavButtonM`}`}
        >
          {status.status.name}
        </div>
      </>
    );
  }
  if (activeJob.jobType === jobTypes.reaction) {
    return (
      <div
        key={status.status.id}
        className={`${activeJob.jobStatus === status.status.id ? `jobNavButtonActive`:`jobNavButtonR`}`}
      >
        {status.status.name}
      </div>
    );
  }
  if (activeJob.jobType === jobTypes.pi) {
    return (
      <div
        key={status.status.id}
        className={`${activeJob.jobStatus === status.status.id ? `jobNavButtonActive`:`jobNavButtonP`}`}
      >
        {status.status.name}
      </div>
    );
  }
}


export default JobStatusSelect;