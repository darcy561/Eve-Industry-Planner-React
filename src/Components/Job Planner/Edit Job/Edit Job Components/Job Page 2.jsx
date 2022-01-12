import { Container, Grid } from "@mui/material";
import React, { useContext, useState } from "react";
import { ActiveJobContext } from "../../../../Context/JobContext";
import { MaterialCard } from "./Page 2 Components/materialCard";
import { PurchasingData } from "./Page 2 Components/purchasingData";
import { TutorialStep2 } from "./Page 2 Components/tutorialStep2";

export function EditPage2({ setJobModified }) {
  const { activeJob } = useContext(ActiveJobContext);
  const [hideItems, updateHideItems] = useState(false);

  return (
    <Container disableGutters maxWidth="false">
      <Grid container direction="row" spacing={2}>
        <Grid item xs={12}>
          <TutorialStep2/>
        </Grid>
        <PurchasingData
          hideItems={hideItems}
          updateHideItems={updateHideItems}
        />
        {activeJob.build.materials.map((material) => {
          if (!hideItems) {
            return (
              <MaterialCard
                key={material.typeID}
                material={material}
                setJobModified={setJobModified}
              />
            );
          } else if (
            hideItems &&
            material.quantityPurchased < material.quantity
          ) {
            return (
              <MaterialCard
                key={material.typeID}
                material={material}
                setJobModified={setJobModified}
              />
            );
          }
        })}
      </Grid>
    </Container>
  );
}
