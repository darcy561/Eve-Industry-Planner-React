import { useState } from "react";
import { useMediaQuery } from "@mui/material";
import { Purchasing_StandardLayout_EditJob } from "./Standard Layout/StandardLayout";
import { Purchasing_MobileLayout_EditJob } from "./Mobile Layout/mobileLayout";
import { useHelperFunction } from "../../../../Hooks/GeneralHooks/useHelperFunctions";

export function LayoutSelector_EditJob_Purchasing({
  activeJob,
  updateActiveJob,
  setJobModified,
  parentChildToEdit,
  updateParentChildToEdit,
  temporaryChildJobs,
}) {
  const { findParentUser } = useHelperFunction();
  const parentUser = findParentUser();
  const [orderDisplay, changeOrderDisplay] = useState(
    !activeJob.layout.localOrderDisplay
      ? parentUser.settings.editJob.defaultOrders
      : activeJob.layout.localOrderDisplay
  );

  const [marketDisplay, changeMarketDisplay] = useState(
    !activeJob.layout.localMarketDisplay
      ? parentUser.settings.editJob.defaultMarket
      : activeJob.layout.localMarketDisplay
  );
  const deviceNotMobile = useMediaQuery((theme) => theme.breakpoints.up("sm"));

  switch (deviceNotMobile) {
    case true:
      return (
        <Purchasing_StandardLayout_EditJob
          activeJob={activeJob}
          updateActiveJob={updateActiveJob}
          setJobModified={setJobModified}
          orderDisplay={orderDisplay}
          changeOrderDisplay={changeOrderDisplay}
          marketDisplay={marketDisplay}
          changeMarketDisplay={changeMarketDisplay}
          parentChildToEdit={parentChildToEdit}
          updateParentChildToEdit={updateParentChildToEdit}
          temporaryChildJobs={temporaryChildJobs}
        />
      );

    case false:
      return (
        <Purchasing_StandardLayout_EditJob
          activeJob={activeJob}
          updateActiveJob={updateActiveJob}
          setJobModified={setJobModified}
          orderDisplay={orderDisplay}
          changeOrderDisplay={changeOrderDisplay}
          marketDisplay={marketDisplay}
          changeMarketDisplay={changeMarketDisplay}
          parentChildToEdit={parentChildToEdit}
          updateParentChildToEdit={updateParentChildToEdit}
          temporaryChildJobs={temporaryChildJobs}
        />
      );
    default:
      return (
        <Purchasing_StandardLayout_EditJob
          activeJob={activeJob}
          updateActiveJob={updateActiveJob}
          setJobModified={setJobModified}
          orderDisplay={orderDisplay}
          changeOrderDisplay={changeOrderDisplay}
          marketDisplay={marketDisplay}
          changeMarketDisplay={changeMarketDisplay}
          parentChildToEdit={parentChildToEdit}
          updateParentChildToEdit={updateParentChildToEdit}
          temporaryChildJobs={temporaryChildJobs}
        />
      );
  }
}
