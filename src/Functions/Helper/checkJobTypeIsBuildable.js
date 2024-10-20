import { jobTypes } from "../../Context/defaultValues";

function checkJobTypeIsBuildable(inputJobType) {
  if (inputJobType === undefined || inputJobType === null) {
    console.error("Missing input type, unable to check if this is buildable.");
    return false;
  }

  return (
    inputJobType === jobTypes.manufacturing ||
    inputJobType === jobTypes.reaction
  );
}

export default checkJobTypeIsBuildable;
