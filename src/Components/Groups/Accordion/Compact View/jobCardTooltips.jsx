import { TWO_DECIMAL_PLACES } from "../../../../Context/defaultValues";

function getTooltipContent(job, timeRemainingCalc) {
  switch (job.jobStatus) {
    case 0:
      return (
        <span>
          <p>Quantity: {job.build.products.totalQuantity.toLocaleString()}</p>
          <p>Job Setups: {job.setupCount().toLocaleString()} </p>
        </span>
      );
    case 1:
      const totalComplete = job.totalCompletedMaterials();
      const totalRemaining = job.totalRemainingMaterials();

      if (totalComplete < job.build.materials.length) {
        return (
          <span>
            <p>
              Awaiting Materials: {totalRemaining}/{job.build.materials.length}
            </p>
          </span>
        );
      }
      return <p>Ready To Build</p>;
    case 2:
      const timeRemaining = sortJobs(job, timeRemainingCalc);

      return (
        <span>
          <p>ESI Jobs Linked: {job.apiJobs.size.toLocaleString()}</p>
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
          <p>
            Items Built: {job.build.products.totalQuantity.toLocaleString()}
          </p>
          <p>
            Item Cost:{" "}
            {job
              .totalCostPerItem()
              .toLocaleString(undefined, TWO_DECIMAL_PLACES)}
          </p>
        </span>
      );
    case 4:
      return (
        <span>
          <p>Market Orders: {job.apiOrders.size.toLocaleString()}</p>
          <p>Transactions: {job.apiTransactions.size.toLocaleString()} </p>
        </span>
      );
    default:
      return null;
  }
}

function sortJobs(job, timeRemainingCalc) {
  let tempJobs = [...job.build.costs.linkedJobs];
  if (tempJobs.length === 0) return null;

  tempJobs.sort((a, b) => {
    if (Date.parse(a.end_date) > Date.parse(b.end_date)) {
      return 1;
    }
    if (Date.parse(a.end_date) < Date.parse(b.end_date)) {
      return -1;
    }
    return 0;
  });
  return timeRemainingCalc(Date.parse(tempJobs[0].end_date));
}

export default getTooltipContent;
