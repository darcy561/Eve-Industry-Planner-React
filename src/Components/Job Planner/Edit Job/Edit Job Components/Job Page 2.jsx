import { Container, Grid } from "@mui/material";
import React, { useContext } from "react";
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
        <PurchasingData />
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
      </Grid>
    </Container>
  );
}
