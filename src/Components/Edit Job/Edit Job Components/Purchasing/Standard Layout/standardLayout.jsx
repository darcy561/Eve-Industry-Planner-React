import { useContext, useMemo } from "react";
import { Grid } from "@mui/material";
import { UsersContext } from "../../../../../Context/AuthContext";
import { TutorialStep2 } from "../tutorialStep2";
import { PurchasingDataPanel_EditJob } from "./Purchasing Data Panel/purchsingDataPanel";
import { MaterialCard } from "./Material Cards/materialCard";

export function Purchasing_StandardLayout_EditJob({
  activeJob,
  updateActiveJob,
  jobModified,
  setJobModified,
  shoppingListTrigger,
  updateShoppingListTrigger,
  shoppingListData,
  updateShoppingListData,
  orderDisplay,
  changeOrderDisplay,
  marketDisplay,
  changeMarketDisplay,
  requiresInventionCosts,
  ignoreInventionCosts,
}) {
  const { users } = useContext(UsersContext);
  const parentUser = useMemo(() => users.find((i) => i.ParentUser), [users]);
  return (
    <Grid container spacing={2}>
      <TutorialStep2 />
      <PurchasingDataPanel_EditJob
        activeJob={activeJob}
        updateActiveJob={updateActiveJob}
        updateShoppingListTrigger={updateShoppingListTrigger}
        updateShoppingListData={updateShoppingListData}
        orderDisplay={orderDisplay}
        changeOrderDisplay={changeOrderDisplay}
        marketDisplay={marketDisplay}
        changeMarketDisplay={changeMarketDisplay}
      />
      <Grid
        container
        item
        spacing={2}
        sx={{
          overflowY: { xs: "scroll", sm: "visible" },
          "&:: -ms-overflow-style": { display: "none" },
          "&:: scrollbar-width": { display: "none" },
          "&::-webkit-scrollbar": { display: "none" },
          paddingRight: { xs: "1px", sm: "0px" },
          marginTop: { xs: "20px", sm: "0px" },
          marginBotton: { xs: "60px", sm: "0px" },
          maxHeight: { xs: "600px", sm: "none" },
        }}
      >
        {activeJob.build.materials.map((material, materialIndex) => {
          if (
            !parentUser.settings.editJob.hideCompleteMaterials ||
            (parentUser.settings.editJob.hideCompleteMaterials &&
              material.quantityPurchased < material.quantity)
          ) {
            return (
              <MaterialCard
                activeJob={activeJob}
                updateActiveJob={updateActiveJob}
                key={material.typeID}
                material={material}
                setJobModified={setJobModified}
                orderDisplay={orderDisplay}
                marketDisplay={marketDisplay}
              />
            );
          }
        })}
      </Grid>
    </Grid>
  );
}
