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
import { useHelperFunction } from "../GeneralHooks/useHelperFunctions";

export function useOpenGroup() {
  const { jobArray, groupArray, updateJobArray } = useContext(JobArrayContext);
  const { updateActiveGroup } = useContext(ActiveJobContext);
  const { userJobSnapshot } = useContext(UserJobSnapshotContext);
  const { updateDataExchange } = useContext(DataExchangeContext);
  const { updateEvePrices } = useContext(EvePricesContext);
  const { updateLoadingText } = useContext(LoadingTextContext);
  const { findJobData } = useFindJobObject();
  const { getItemPrices } = useFirebase();
  const { findParentUser } = useHelperFunction();

  const parentUser = findParentUser();

  async function openGroup(inputGroupID) {
    let newJobArray = [...jobArray];
    let requestedGroup = groupArray.find((i) => i.groupID === inputGroupID);
    if (!requestedGroup) {
      return;
    }
    updateDataExchange((prev) => !prev);

    const itemPriceRequest = [
      getItemPrices([...requestedGroup.materialIDs], parentUser),
    ];
    updateLoadingText((prevObj) => ({
      ...prevObj,
      jobData: true,
      priceData: true,
    }));

    for (let jobID of [...requestedGroup.includedJobIDs]) {
      await findJobData(
        jobID,
        userJobSnapshot,
        newJobArray,
        undefined,
        "groupJob"
      );
    }
    updateLoadingText((prevObj) => ({
      ...prevObj,
      jobDataComp: true,
    }));

    const itemPriceResult = await Promise.all(itemPriceRequest);
    updateLoadingText((prevObj) => ({
      ...prevObj,
      jobData: true,
      jobDataComp: true,
      priceData: true,
      priceDataComp: true,
    }));
    updateEvePrices((prev) => ({
      ...prev,
      ...itemPriceResult,
    }));
    updateActiveGroup(inputGroupID);
    updateJobArray(newJobArray);
    updateDataExchange((prev) => !prev);
    updateLoadingText((prevObj) => ({
      ...prevObj,
      jobData: false,
      jobDataComp: false,
      priceData: false,
      priceDataComp: false,
    }));
  }

  return {
    openGroup,
  };
}
