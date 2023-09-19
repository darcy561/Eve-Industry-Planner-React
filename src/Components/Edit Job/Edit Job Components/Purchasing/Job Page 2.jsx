import { Container, Grid } from "@mui/material";
import { useContext, useMemo, useState } from "react";
import {
  IsLoggedInContext,
  UsersContext,
} from "../../../../Context/AuthContext";
import { InventionCostsCard } from "./Page 2 Components/InventionCosts";
import MaterialCard from "./Page 2 Components/materialCard";
import { PurchasingData } from "./Page 2 Components/purchasingData";
import { TutorialStep2 } from "./Page 2 Components/tutorialStep2";

export function EditPage2({
  activeJob,
  updateActiveJob,
  setJobModified,
  updateShoppingListTrigger,
  updateShoppingListData,
}) {
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { users } = useContext(UsersContext);
  const parentUser = useMemo(
    () => users.find((i) => i.ParentUser),
    [users, isLoggedIn]
  );

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

  //metaLevel
  const requiresInventionCosts = [2, 14, 53];
  //TypeID
  const ignoreInventionCosts = [];

  return (
    <Container disableGutters>
      <Grid container spacing={2}>
        <TutorialStep2 />

        <PurchasingData
          activeJob={activeJob}
          updateActiveJob={updateActiveJob}
          orderDisplay={orderDisplay}
          changeOrderDisplay={changeOrderDisplay}
          marketDisplay={marketDisplay}
          changeMarketDisplay={changeMarketDisplay}
          updateShoppingListTrigger={updateShoppingListTrigger}
          updateShoppingListData={updateShoppingListData}
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
            if (!parentUser.settings.editJob.hideCompleteMaterials) {
              return (
                <MaterialCard
                  activeJob={activeJob}
                  updateActiveJob={updateActiveJob}
                  materialIndex={materialIndex}
                  key={material.typeID}
                  material={material}
                  setJobModified={setJobModified}
                  orderDisplay={orderDisplay}
                  marketDisplay={marketDisplay}
                />
              );
            } else if (
              parentUser.settings.editJob.hideCompleteMaterials &&
              material.quantityPurchased < material.quantity
            ) {
              return (
                <MaterialCard
                  activeJob={activeJob}
                  updateActiveJob={{ updateActiveJob }}
                  key={material.typeID}
                  material={material}
                  setJobModified={setJobModified}
                  orderDisplay={orderDisplay}
                  marketDisplay={marketDisplay}
                />
              );
            }
          })}
          {requiresInventionCosts.includes(activeJob.metaLevel) &&
          !ignoreInventionCosts.includes(activeJob.itemID) ? (
            <InventionCostsCard
              activeJob={activeJob}
              updateActiveJob={updateActiveJob}
              setJobModified={setJobModified}
            />
          ) : null}
        </Grid>
      </Grid>
    </Container>
  );
}
