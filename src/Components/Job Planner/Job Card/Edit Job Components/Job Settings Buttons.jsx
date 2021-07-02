import react, { useContext } from "react";
import {
  ActiveJobContext,
  JobStatusContext,
} from "../../../../Context/JobContext";

function StepButtons() {
  const [activeJob, updateActiveJob] = useContext(ActiveJobContext);
  const [jobStatus, updateJobStatus] = useContext(JobStatusContext);

  if (activeJob.jobStatus === jobStatus[0].id) {
    return (
      <div
        className="settingsButton"
        onClick={() => {
          updateActiveJob({...activeJob,[activeJob.jobStatus]: activeJob.jobStatus++,});
          console.log(activeJob);
        }}
      >
        Next Step{" "}
      </div>
    );
  }

  if (
    activeJob.jobStatus > jobStatus[0].id && activeJob.jobStatus < jobStatus.length - 1 ) {
    return (
      <>
        <div
          className="settingsButton"
          onClick={() => {
            updateActiveJob({...activeJob,[activeJob.jobStatus]: activeJob.jobStatus--,});
            console.log(activeJob);
          }}
        >
          Previous Step
        </div>
        <div
          className="settingsButton"
          onClick={() => {
            updateActiveJob({...activeJob,[activeJob.jobStatus]: activeJob.jobStatus++,});
            console.log(activeJob);
          }}
        >
          Next Step
        </div>
      </>
    );
  }

  if (activeJob.jobStatus === jobStatus.length - 1) {
    return (
      <div
        className="settingsButton"
        onClick={() => {
          updateActiveJob({...activeJob,[activeJob.jobStatus]: activeJob.jobStatus--, });
          console.log(activeJob);
        }}
      >
        Previous Step{" "}
      </div>
    );
  }
}
//renders the buttons
export function JobSettingsButtons() {
  return (
    <div className="settingsButtonWrapper">
      {/* calls the function above to render the jobStatus step forward/backwards buttons */}
      <StepButtons />
    </div>
  );
}
