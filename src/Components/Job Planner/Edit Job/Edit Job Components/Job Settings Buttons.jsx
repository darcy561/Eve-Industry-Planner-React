import react, { useContext } from "react";
import {
  ActiveJobContext,
  JobStatusContext,
  SelectedPageContext
} from "../../../../Context/JobContext";
import { CalculateTotals } from "../blueprintCalcs";

function StepButtons() {
  const [activeJob, updateActiveJob] = useContext(ActiveJobContext);
  const [jobStatus, updateJobStatus] = useContext(JobStatusContext);
  const [SelectedPage, ChangeSelectedPage] = useContext(SelectedPageContext);

  if (activeJob.jobStatus === jobStatus[0].id) {
    return (
      <div
        className="settingsButton"
        onClick={() => {
          updateActiveJob(prevState => ({ ...prevState, jobStatus: prevState.jobStatus + 1 }));
        }}
      >
        Next Step
      </div>
    );
  };

  if (
    activeJob.jobStatus > jobStatus[0].id && activeJob.jobStatus < jobStatus.length ) {
    return (
      <>
        <div
          className="settingsButton"
          onClick={() => {
            updateActiveJob(prevState => ({ ...prevState, jobStatus: prevState.jobStatus - 1 }));
          }}
        >
          Previous Step
        </div>
        <div
          className="settingsButton"
          onClick={() => {
            updateActiveJob(prevState => ({ ...prevState, jobStatus: prevState.jobStatus + 1 }));
          }}
        >
          Next Step
        </div>
      </>
    );
  };

  if (activeJob.jobStatus === jobStatus.length) {
    return (
      <div
        className="settingsButton"
        onClick={() => {
          updateActiveJob(prevState => ({ ...prevState, jobStatus: prevState.jobStatus - 1 }));
        }}
      >
        Previous Step
      </div>
    );
  };
};

function RefreshCalcs() {
  const [activeJob, updateActiveJob] = useContext(ActiveJobContext);
  const [SelectedPage, ChangeSelectedPage] = useContext(SelectedPageContext);

  if (SelectedPage === 1) {
    return (
      <div className="settingsButton"
        onClick={() => {
          const newArray = CalculateTotals(activeJob);
          updateActiveJob(prevObj => ({ ...prevObj, job: { ...prevObj.job, materials: newArray } }))
        }}
      >
        Refresh
      </div>
    );
  } else {
    return (
      <></>
    );
  };
};


//renders the buttons
function JobSettingsButtons() {
  return (
    <div className="settingsButtonWrapper">
      <RefreshCalcs />
      {/* calls the function above to render the jobStatus step forward/backwards buttons */}
      <StepButtons />
    </div>
  );
};

export {JobSettingsButtons};
