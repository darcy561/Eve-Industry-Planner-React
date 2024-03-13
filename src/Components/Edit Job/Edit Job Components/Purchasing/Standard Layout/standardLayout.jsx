import { Grid } from "@mui/material";
import { TutorialStep2 } from "../tutorialStep2";
import { PurchasingDataPanel_EditJob } from "./Purchasing Data Panel/purchsingDataPanel";
import { MaterialCard } from "./Material Cards/materialCard";
import { InventionCostsCard } from "./Invention Costs/inventionCostsCard";
import { MaterialCardFrame_Purchasing } from "./Material Cards/materialCardFrame";
import { useHelperFunction } from "../../../../../Hooks/GeneralHooks/useHelperFunctions";

export function Purchasing_StandardLayout_EditJob({
  activeJob,
  updateActiveJob,
  setJobModified,
  orderDisplay,
  changeOrderDisplay,
  marketDisplay,
  changeMarketDisplay,
  requiresInventionCosts,
  ignoreInventionCosts,
  parentChildToEdit,
  updateParentChildToEdit,
  temporaryChildJobs,
}) {
  const { findParentUser } = useHelperFunction();
  const parentUser = findParentUser();

  return (
    <Grid container spacing={2}>
      <TutorialStep2 />
      <PurchasingDataPanel_EditJob
        activeJob={activeJob}
        updateActiveJob={updateActiveJob}
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
              <MaterialCardFrame_Purchasing
                activeJob={activeJob}
                updateActiveJob={updateActiveJob}
                key={material.typeID}
                material={material}
                materialIndex={materialIndex}
                setJobModified={setJobModified}
                orderDisplay={orderDisplay}
                marketDisplay={marketDisplay}
                parentChildToEdit={parentChildToEdit}
                updateParentChildToEdit={updateParentChildToEdit}
                temporaryChildJobs={temporaryChildJobs}
              />
            );
          }
        })}
        <InventionCostsCard
          activeJob={activeJob}
          updateActiveJob={updateActiveJob}
          setJobModified={setJobModified}
        />
      </Grid>
    </Grid>
  );
}
