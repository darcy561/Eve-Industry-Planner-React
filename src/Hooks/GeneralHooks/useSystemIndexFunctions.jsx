import { useContext, useMemo } from "react";
import { SystemIndexContext } from "../../Context/EveDataContext";
import { fetchSystemIndexes } from "../FetchDataHooks/fetchSystemIndexes";
import { UsersContext } from "../../Context/AuthContext";
import GLOBAL_CONFIG from "../../global-config-app";

export function useSystemIndexFunctions() {
  const { systemIndexData } = useContext(SystemIndexContext);
  const { users } = useContext(UsersContext);
  const parentUser = useMemo(() => users.find((i) => i.ParentUser), [users]);
  const { DEFAULT_ITEM_REFRESH_PERIOD } = GLOBAL_CONFIG;

  async function findMissingSystemIndex(requiredIDs) {
    if (!Array.isArray(requiredIDs)) {
      requiredIDs = [requiredIDs];
    }

    const requiredIDsSet = new Set(requiredIDs);
    const availableIDs = new Set(Object.keys(systemIndexData));
    const missingIDs = [];

    for (const id of requiredIDsSet) {
      if (!availableIDs.has(String(id))) {
        missingIDs.push(id);
      }
    }

    if (missingIDs.length === 0) {
      return { ...systemIndexData };
    }

    const fetchInput = missingIDs.length === 1 ? missingIDs[0] : missingIDs;
    const missingSystemIndexes = await fetchSystemIndexes(
      fetchInput,
      parentUser
    );

    return missingSystemIndexes;
  }

  async function refreshSystemIndexes() {
    const chosenRefreshPoint =
      Date.now() - DEFAULT_ITEM_REFRESH_PERIOD * 24 * 60 * 60 * 1000;
    const systemIndexObjects = Object.values(systemIndexData);
    const outdatedIndexIDs = [];

    for (let indexObject of systemIndexObjects) {
      if (indexObject.lastUpdated <= chosenRefreshPoint) {
        outdatedIndexIDs.push(indexObject.solar_system_id);
      }
    }

    if (outdatedIndexIDs.length === 0) return {};

    const fetchInput =
      outdatedIndexIDs.length === 1 ? outdatedIndexIDs[0] : outdatedIndexIDs;

    const refreshedSystemIndexes = await fetchSystemIndexes(
      fetchInput,
      parentUser
    );

    return refreshedSystemIndexes;
  }

  return {
    findMissingSystemIndex,
    refreshSystemIndexes,
  };
}
