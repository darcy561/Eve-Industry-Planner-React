import { useContext, useMemo } from "react";
import {
  UserJobSnapshotContext,
  UsersContext,
} from "../../Context/AuthContext";
import { EvePricesContext } from "../../Context/EveDataContext";
import { ActiveJobContext, JobArrayContext } from "../../Context/JobContext";
import { DataExchangeContext } from "../../Context/LayoutContext";
import { useFindJobObject } from "../GeneralHooks/useFindJobObject";
import { useFirebase } from "../useFirebase";

export function useOpenGroup() {
  const { jobArray, groupArray, updateJobArray } = useContext(JobArrayContext);
  const { updateActiveGroup } = useContext(ActiveJobContext);
  const { userJobSnapshot } = useContext(UserJobSnapshotContext);
  const { updateDataExchange } = useContext(DataExchangeContext);
  const { users } = useContext(UsersContext);
  const { updateEvePrices } = useContext(EvePricesContext);
  const { findJobData } = useFindJobObject();
  const { getItemPrices } = useFirebase();

  const parentUser = useMemo(() => users.find((i) => i.ParentUser), [users]);

  const openGroup = async (inputGroupID) => {
    let newJobArray = [...jobArray];
    let requestedGroup = groupArray.find((i) => i.groupID === inputGroupID);
    if (requestedGroup === undefined) {
      return;
    }
    updateDataExchange((prev) => !prev);

    let pricePromise = [
      getItemPrices(requestedGroup.includedTypeIDs, parentUser),
    ];

    for (let jobID of requestedGroup.includedJobIDs) {
      await findJobData(jobID, userJobSnapshot, newJobArray, undefined, "none");
    }

    let returnPrices = await Promise.all(pricePromise);
    updateEvePrices((prev) => {
      let newEvePrices = returnPrices[0].filter(
        (n) => !prev.some((p) => p.typeID === n.typeID)
      );
      return prev.concat(newEvePrices);
    });
    console.log(newJobArray);
    updateActiveGroup(requestedGroup);
    updateJobArray(newJobArray);
    updateDataExchange((prev) => !prev);
  };

  return {
    openGroup,
  };
}
