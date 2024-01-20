import { Icon, Tooltip } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import { useJobManagement } from "../../../../Hooks/useJobManagement";

<<<<<<< HEAD
function getTooltipContent(job, timeRemaining) {
=======
function getTooltipContent(job, timeRemaining){
>>>>>>> 30eec5e2076ea65502f8af77eb7e306834252569
  switch (job.jobStatus) {
    case 0:
      return (
        <span>
<<<<<<< HEAD
          <p>Runs: {job.runCount.toLocaleString()}</p>
          <p>Job Slots: {job.jobCount.toLocaleString()} </p>
=======
          <p>Job Setups: {job.totalSetupCount}</p>
>>>>>>> 30eec5e2076ea65502f8af77eb7e306834252569
        </span>
      );
    case 1:
      if (job.totalComplete < job.totalMaterials) {
        return (
          <span>
            <p>
              Awaiting Materials: {job.totalMaterials - job.totalComplete}/
              {job.totalMaterials}
            </p>
          </span>
        );
      }
      return <p>Ready To Build</p>;
    case 2:
      return (
        <span>
          <p>ESI Jobs Linked: {job.apiJobs.length.toLocaleString()}</p>
          {job.apiJobs.length > 0 && (
            <p>
              {timeRemaining === "complete"
                ? "Complete"
                : `Ends In: ${timeRemaining}`}
            </p>
          )}
        </span>
      );
    case 3:
      return (
        <span>
          <p>Items Built: {job.itemQuantity.toLocaleString()}</p>
        </span>
      );
    case 4:
      return (
        <span>
          <p>Market Orders: {job.apiOrders.length.toLocaleString()}</p>
          <p>Transactions: {job.apiTransactions.length.toLocaleString()} </p>
        </span>
      );
    default:
      return null;
  }
}

export default function PlannerInfoBadge({ job }) {
  const { timeRemainingCalc } = useJobManagement();
  const timeRemaining = timeRemainingCalc(job.endDateDisplay);
  const tooltipContent = getTooltipContent(job, timeRemaining);

  if (!tooltipContent) {
    return null;
  }

  return (
    <Tooltip title={tooltipContent} arrow placement="left">
      <Icon color="primary">
        <InfoIcon fontSize="small" />
      </Icon>
    </Tooltip>
  );
}
