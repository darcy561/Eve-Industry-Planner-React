import { Container, Grid } from "@mui/material";
import React, { useContext, useState } from "react";
import { UsersContext } from "../../../../Context/AuthContext";
import { ActiveJobContext } from "../../../../Context/JobContext";
import { MaterialCard } from "./Page 2 Components/materialCard";
import { PurchasingData } from "./Page 2 Components/purchasingData";
import { TutorialStep2 } from "./Page 2 Components/tutorialStep2";

export function EditPage2({ setJobModified }) {
  const { activeJob } = useContext(ActiveJobContext);
  const { users } = useContext(UsersContext);
  const parentUser = users.find((i) => i.ParentUser === true);

  return (
    <Container disableGutters maxWidth="false">
      <Grid container direction="row" spacing={2}>
        {!parentUser.settings.layout.hideTutorials && (
          <Grid item xs={12}>
            <TutorialStep2 />
          </Grid>
        )}
        <PurchasingData/>
        {activeJob.build.materials.map((material) => {
          if (!parentUser.settings.editJob.hideCompleteMaterials) {
            return (
              <MaterialCard
                key={material.typeID}
                material={material}
                setJobModified={setJobModified}
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
              />
            );
          }
        })}
      </Grid>
    </Container>
  );
}
