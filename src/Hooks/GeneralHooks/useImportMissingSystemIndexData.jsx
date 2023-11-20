import { useContext } from "react";
import { SystemIndexContext } from "../../Context/EveDataContext";
import { fetchSystemIndexes } from "../FetchDataHooks/fetchSystemIndexes";

export function useMissingSystemIndex() {
  const { systemIndexData } = useContext(SystemIndexContext);

  const findMissingSystemIndex = async (requiredIDs) => {
    if (!Array.isArray(requiredIDs)) {
      requiredIDs = [requiredIDs];
    }

    const requiredIDsSet = new Set(requiredIDs);
    const availableIDs = new Set(Object.keys(systemIndexData));
    const missingIDs = []
    
    for (const id of requiredIDsSet) {
      if (!availableIDs.has(String(id))) {
        missingIDs.push(id);
      }
    }

    if (missingIDs.length === 0) {
      return systemIndexData;
    }

    const fetchInput = missingIDs.length === 1 ? missingIDs[0] : missingIDs;
    const missingSystemIndexes = await fetchSystemIndexes(fetchInput);

    return { ...systemIndexData, ...missingSystemIndexes };
  };

  return {
    findMissingSystemIndex,
  };
}
