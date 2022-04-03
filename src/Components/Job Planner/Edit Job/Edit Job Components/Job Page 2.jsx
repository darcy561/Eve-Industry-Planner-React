import { Container, Grid } from "@mui/material";
import { useContext, useEffect, useMemo, useState } from "react";
import { IsLoggedIn, IsLoggedInContext, UsersContext } from "../../../../Context/AuthContext";
import { ActiveJobContext } from "../../../../Context/JobContext";
import { InventionCostsCard } from "./Page 2 Components/InventionCosts";
import { MaterialCard } from "./Page 2 Components/materialCard";
import { PurchasingData } from "./Page 2 Components/purchasingData";
import { TutorialStep2 } from "./Page 2 Components/tutorialStep2";

export function EditPage2({ setJobModified }) {
  const { activeJob } = useContext(ActiveJobContext);
  const { IsLoggedIn } = useContext(IsLoggedInContext);
  const { users } = useContext(UsersContext);
  const parentUser = useMemo(() => { return users.find((i) => i.ParentUser) }, [users, IsLoggedIn]);
  const [orderDisplay, changeOrderDisplay] = useState(parentUser.settings.editJob.defaultOrders);
  const [marketDisplay, changeMarketDisplay] = useState(parentUser.settings.editJob.defaultMarket)

  //metaLevel
  const requiresInventionCosts = [2, 14, 53];
  //TypeID
  const ignoreInventionCosts = [];

  return (
    <Container disableGutters maxWidth="false">
      <Grid container direction="row" spacing={2}>
        {!parentUser.settings.layout.hideTutorials && (
          <Grid item xs={12}>
            <TutorialStep2 />
          </Grid>
        )}
        <PurchasingData
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
            "&:: -ms-overflow-style": { display:"none" },
            "&:: scrollbar-width": { display:"none"},
            "&::-webkit-scrollbar": { display: "none" },
            paddingRight: { xs: "1px", sm: "0px" },
            marginTop: { xs: "20px", sm: "0px" },
            marginBotton: { xs: "60px", sm: "0px" },
            maxHeight: { xs: "600px", sm: "none" },
          }}
        >
          {activeJob.build.materials.map((material) => {
            if (!parentUser.settings.editJob.hideCompleteMaterials) {
              return (
                <MaterialCard
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
                  key={material.typeID}
                  material={material}
                  setJobModified={setJobModified}
                  orderDisplay={orderDisplay}
                  marketDisplay={marketDisplay}
                />
              );
            }
          })}
          {requiresInventionCosts.includes(activeJob.metaLevel) && !ignoreInventionCosts.includes(activeJob.itemID) ?
              <InventionCostsCard setJobModified={setJobModified}/>: null
          }
        </Grid>
      </Grid>
    </Container>
  );
}
