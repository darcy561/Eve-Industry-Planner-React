import { useContext, useMemo } from "react";
import {
  UserJobSnapshotContext,
  UsersContext,
} from "../../Context/AuthContext";
import { EvePricesContext } from "../../Context/EveDataContext";
import { ActiveJobContext, JobArrayContext } from "../../Context/JobContext";
import {
  DataExchangeContext,
  LoadingTextContext,
} from "../../Context/LayoutContext";
import { useFindJobObject } from "../GeneralHooks/useFindJobObject";
import { useFirebase } from "../useFirebase";

export function useOpenGroup() {
  const { jobArray, groupArray, updateJobArray } = useContext(JobArrayContext);
  const { updateActiveGroup } = useContext(ActiveJobContext);
  const { userJobSnapshot } = useContext(UserJobSnapshotContext);
  const { updateDataExchange } = useContext(DataExchangeContext);
  const { users } = useContext(UsersContext);
  const { updateEvePrices } = useContext(EvePricesContext);
  const { updateLoadingText } = useContext(LoadingTextContext);
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

    let pricePromise = [getItemPrices(requestedGroup.materialIDs, parentUser)];
    updateLoadingText((prevObj) => ({
      ...prevObj,
      jobData: true,
      priceData: true,
    }));

    for (let jobID of requestedGroup.includedJobIDs) {
      await findJobData(jobID, userJobSnapshot, newJobArray, undefined, "none");
    }
    updateLoadingText((prevObj) => ({
      ...prevObj,
      jobDataComp: true,
    }));

    let returnPrices = await Promise.all(pricePromise);
    updateLoadingText((prevObj) => ({
      ...prevObj,
      jobData: true,
      jobDataComp: true,
      priceData: true,
      priceDataComp: true,
    }));
    updateEvePrices((prev) => {
      let newEvePrices = returnPrices[0].filter(
        (n) => !prev.some((p) => p.typeID === n.typeID)
      );
      return prev.concat(newEvePrices);
    });

    updateActiveGroup(requestedGroup);
    updateJobArray(newJobArray);
    updateDataExchange((prev) => !prev);
    updateLoadingText((prevObj) => ({
      ...prevObj,
      jobData: false,
      jobDataComp: false,
      priceData: false,
      priceDataComp: false,
    }));
  };

  return {
    openGroup,
  };
}
