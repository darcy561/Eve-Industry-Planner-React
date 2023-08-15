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
    const availableIDs = new Set(systemIndexData.map((i) => i.solar_system_id));

    const missingIDs = [...requiredIDsSet].filter((i) => !availableIDs.has(i));

    if (missingIDs.length === 0) {
      return null;
    }

    if (missingIDs.length === 0) {
      return null;
    }
    const fetchInput = missingIDs.length === 1 ? missingIDs[0] : missingIDs;
    const missingSystemIndexes = await fetchSystemIndexes(fetchInput);

    return [
      ...systemIndexData,
      ...(missingIDs.length === 1
        ? [missingSystemIndexes]
        : missingSystemIndexes),
    ];
  };

  return {
    findMissingSystemIndex,
  };
}
