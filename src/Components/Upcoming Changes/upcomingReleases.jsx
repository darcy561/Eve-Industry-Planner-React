import { Grid } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { jobTypes } from "../../Context/defaultValues";
import { PageLoadContext } from "../../Context/LayoutContext";
import { useRefreshUser } from "../../Hooks/useRefreshUser";
import { LoadingPage } from "../loadingPage";
import { ManufacturingOptionsUpcomingChanges } from "./manufacturingOptions";
import { ReactionOptionsUpcomingChanges } from "./reactionOptions";
import { UpcomingChangesSearch } from "./searchBar";
import { SisiItem } from "./sisiItem";
import { TranqItem } from "./tranqItem";

export default function UpcomingChanges() {
  const { checkUserState } = useRefreshUser();
  const { pageLoad } = useContext(PageLoadContext);
  const [itemLoad, updateItemLoad] = useState(false);
  const [tranqItem, updateTranqItem] = useState(null);
  const [sisiItem, updateSisiItem] = useState(null);

  useEffect(() => {
    checkUserState();
  }, []);

  if (pageLoad) {
    return <LoadingPage />;
  } else {
    return (
      <Grid
        container
        sx={{
          paddingLeft: { xs: "10px", sm: "20px" },
          paddingRight: { xs: "10px", sm: "20px" },
          marginTop: "5px",
        }}
        spacing={2}
      >
        <Grid item xs={12}>
          <UpcomingChangesSearch
            updateTranqItem={updateTranqItem}
            updateSisiItem={updateSisiItem}
            updateItemLoad={updateItemLoad}
          />
        </Grid>
        <Grid item xs={12}>
          {tranqItem !== null && sisiItem !== null ? (
            tranqItem.jobType === jobTypes.manufacturing &&
            sisiItem.jobType === jobTypes.manufacturing ? (
              <ManufacturingOptionsUpcomingChanges
                tranqItem={tranqItem}
                updateTranqItem={updateTranqItem}
                sisiItem={sisiItem}
                updateSisiItem={updateSisiItem}
                itemLoad={itemLoad}
              />
            ) : tranqItem.jobType === jobTypes.reaction &&
              sisiItem.jobType === jobTypes.reaction ? (
              <ReactionOptionsUpcomingChanges
                tranqItem={tranqItem}
                updateTranqItem={updateTranqItem}
                sisiItem={sisiItem}
                updateSisiItem={updateSisiItem}
                itemLoad={itemLoad}
              />
            ) : null
          ) : null}
        </Grid>
        <Grid container item xs={12} spacing={2} sx={{}}>
          <Grid item xs={12} md={6}>
            <TranqItem tranqItem={tranqItem} itemLoad={itemLoad} />
          </Grid>
          <Grid item xs={12} md={6}>
            <SisiItem sisiItem={sisiItem} itemLoad={itemLoad} />
          </Grid>
        </Grid>
      </Grid>
    );
  }
}
