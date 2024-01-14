import { useContext, useMemo, useState } from "react";
import { useMediaQuery } from "@mui/material";
import { Purchasing_StandardLayout_EditJob } from "./Standard Layout/StandardLayout";
import { Purchasing_MobileLayout_EditJob } from "./Mobile Layout/mobileLayout";
import { UsersContext } from "../../../../Context/AuthContext";

export function LayoutSelector_EditJob_Purchasing({
  activeJob,
  updateActiveJob,
  setJobModified,
  parentChildToEdit,
  updateParentChildToEdit,
  temporaryChildJobs
}) {
  const { users } = useContext(UsersContext);
  const parentUser = useMemo(() => users.find((i) => i.ParentUser), [users]);
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

  //metaLevel
  const requiresInventionCosts = new Set([2, 14, 53]);
  //TypeID
  const ignoreInventionCosts = new Set();

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
          requiresInventionCosts={requiresInventionCosts}
          ignoreInventionCosts={ignoreInventionCosts}
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
          requiresInventionCosts={requiresInventionCosts}
          ignoreInventionCosts={ignoreInventionCosts}
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
          requiresInventionCosts={requiresInventionCosts}
          ignoreInventionCosts={ignoreInventionCosts}
          parentChildToEdit={parentChildToEdit}
          updateParentChildToEdit={updateParentChildToEdit}
          temporaryChildJobs={temporaryChildJobs}
        />
      );
  }
}
