import { Button } from "@mui/material";
import { useContext } from "react";
import { EvePricesContext } from "../../../../../../../Context/EveDataContext";

export function CreateChildJobsButtons_ChildJobPopoverFrame({
  childJobsLocation,
  childJobObjects,
  jobDisplay,
  temporaryChildJobs,
  updateTemporaryChildJobs,
  tempPrices,
  setJobModified,
}) {
  const { updateEvePrices } = useContext(EvePricesContext);

  if (childJobsLocation.length > 0) return null;

  if (temporaryChildJobs[childJobObjects[jobDisplay].itemID]) {
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
  } else {
    return (
      <Button
        size="small"
        onClick={() => {
          updateTemporaryChildJobs((prev) => ({
            ...prev,
            [childJobObjects[jobDisplay].itemID]: childJobObjects[jobDisplay],
          }));
          updateEvePrices((prev) => {
            const prevIds = new Set(prev.map((item) => item.typeID));
            const uniqueNewEvePrices = tempPrices.filter(
              (item) => !prevIds.has(item.typeID)
            );
            return [...prev, ...uniqueNewEvePrices];
          });
          setJobModified(true);
        }}
      >
        Mark For Creation
      </Button>
    );
  }
}
