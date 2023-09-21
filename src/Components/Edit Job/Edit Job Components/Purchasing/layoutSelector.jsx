import { useContext, useMemo, useState } from "react";
import { useMediaQuery } from "@mui/material";
import { Purchasing_StandardLayout_EditJob } from "./Standard Layout/StandardLayout";
import { Purchasing_MobileLayout_EditJob } from "./Mobile Layout/mobileLayout";
import { UsersContext } from "../../../../Context/AuthContext";
import { ShoppingListDialog } from "../../../Job Planner/Dialogues/ShoppingList/ShoppingList";

export function LayoutSelector_EditJob_Purchasing({
  activeJob,
  updateActiveJob,
  jobModified,
  setJobModified,
}) {
  const { users } = useContext(UsersContext);
  const [shoppingListTrigger, updateShoppingListTrigger] = useState(false);
  const [shoppingListData, updateShoppingListData] = useState([]);
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
        <>
          <ShoppingListDialog
            shoppingListTrigger={shoppingListTrigger}
            updateShoppingListTrigger={updateShoppingListTrigger}
            shoppingListData={shoppingListData}
          />
          <Purchasing_StandardLayout_EditJob
            activeJob={activeJob}
            updateActiveJob={updateActiveJob}
            jobModified={jobModified}
            setJobModified={setJobModified}
            shoppingListTrigger={shoppingListTrigger}
            updateShoppingListTrigger={updateShoppingListTrigger}
            shoppingListData={shoppingListData}
            updateShoppingListData={updateShoppingListData}
            orderDisplay={orderDisplay}
            changeOrderDisplay={changeOrderDisplay}
            marketDisplay={marketDisplay}
            changeMarketDisplay={changeMarketDisplay}
            requiresInventionCosts={requiresInventionCosts}
            ignoreInventionCosts={ignoreInventionCosts}
          />
        </>   
      );

    case false:
      return (
        <Purchasing_StandardLayout_EditJob
          activeJob={activeJob}
          updateActiveJob={updateActiveJob}
          jobModified={jobModified}
          setJobModified={setJobModified}
          shoppingListTrigger={shoppingListTrigger}
          updateShoppingListTrigger={updateShoppingListTrigger}
          shoppingListData={shoppingListData}
          updateShoppingListData={updateShoppingListData}
          orderDisplay={orderDisplay}
          changeOrderDisplay={changeOrderDisplay}
          marketDisplay={marketDisplay}
          changeMarketDisplay={changeMarketDisplay}
          requiresInventionCosts={requiresInventionCosts}
          ignoreInventionCosts={ignoreInventionCosts}
        />
      );
    default:
      return (
        <Purchasing_StandardLayout_EditJob
          activeJob={activeJob}
          updateActiveJob={updateActiveJob}
          jobModified={jobModified}
          setJobModified={setJobModified}
          shoppingListTrigger={shoppingListTrigger}
          updateShoppingListTrigger={updateShoppingListTrigger}
          shoppingListData={shoppingListData}
          updateShoppingListData={updateShoppingListData}
          orderDisplay={orderDisplay}
          changeOrderDisplay={changeOrderDisplay}
          marketDisplay={marketDisplay}
          changeMarketDisplay={changeMarketDisplay}
          requiresInventionCosts={requiresInventionCosts}
          ignoreInventionCosts={ignoreInventionCosts}
        />
      );
  }
}
