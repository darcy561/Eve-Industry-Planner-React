import { useContext, useState } from "react";
import { useMediaQuery } from "@mui/material";
import { Purchasing_StandardLayout_EditJob } from "./Standard Layout/standardLayout";
import { Purchasing_MobileLayout_EditJob } from "./Mobile Layout/mobileLayout";
import { ApplicationSettingsContext } from "../../../../Context/LayoutContext";

export function LayoutSelector_EditJob_Purchasing({
  activeJob,
  updateActiveJob,
  setJobModified,
  parentChildToEdit,
  updateParentChildToEdit,
  temporaryChildJobs,
}) {
  const { applicationSettings } = useContext(ApplicationSettingsContext);
  const [orderDisplay, changeOrderDisplay] = useState(
    !activeJob.layout.localOrderDisplay
      ? applicationSettings.defaultOrders
      : activeJob.layout.localOrderDisplay
  );

  const [marketDisplay, changeMarketDisplay] = useState(
    !activeJob.layout.localMarketDisplay
      ? applicationSettings.defaultMarket
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
