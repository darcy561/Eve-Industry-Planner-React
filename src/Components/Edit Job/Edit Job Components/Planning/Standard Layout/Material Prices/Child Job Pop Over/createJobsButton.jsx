import { Button } from "@mui/material";
import { useContext } from "react";
import { EvePricesContext } from "../../../../../../../Context/EveDataContext";

export function CancelCreateChildJobButton_ChildJobPopoverFrame({
  childJobObjects,
  jobDisplay,
  temporaryChildJobs,
  updateTemporaryChildJobs,
}) {
  return (
    <Button
      size="small"
      onClick={() => {
        let newTempChildJobs = { ...temporaryChildJobs };
        delete newTempChildJobs[childJobObjects[jobDisplay].itemID];
        updateTemporaryChildJobs(newTempChildJobs);
      }}
    >
      Cancel Creation
    </Button>
  );
}
export function CreateChildJobButton_ChildJobPopoverFrame({
  childJobObjects,
  jobDisplay,
  updateTemporaryChildJobs,
  tempPrices,
  setJobModified,
}) {
  const { updateEvePrices } = useContext(EvePricesContext);

  return (
    <Button
      size="small"
      onClick={() => {
        updateTemporaryChildJobs((prev) => ({
          ...prev,
          [childJobObjects[jobDisplay].itemID]: childJobObjects[jobDisplay],
        }));
        updateEvePrices((prev) => ({
          ...prev,
          ...tempPrices,
        }));
        setJobModified(true);
      }}
    >
      Mark For Creation
    </Button>
  );
}
