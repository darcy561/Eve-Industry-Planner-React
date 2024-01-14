import { lazy, useContext, useEffect, Suspense } from "react";
import { PlannerAccordion } from "./Planner Components/accordion";
import { useRefreshUser } from "../../Hooks/useRefreshUser";
import {
  JobPlannerPageTriggerContext,
  PageLoadContext,
  UserLoginUIContext,
} from "../../Context/LayoutContext";
import { LoadingPage } from "../loadingPage";
import { SearchBar } from "./Planner Components/searchbar";
import { Grid } from "@mui/material";
import { TutorialPlanner } from "./Planner Components/tutorialPlanner";
import { ShoppingListDialog } from "./Dialogues/ShoppingList/ShoppingList";
import { PriceEntryDialog } from "./Dialogues/PriceEntry/PriceEntryList";
import { MassBuildFeedback } from "./Planner Components/massBuildInfo";
import { ESIOffline } from "../offlineNotification";
import { UserLogInUI } from "../Auth/LoginUI/LoginUI";

const EditGroup = lazy(() => import("./Groups/GroupPage"));

export default function JobPlanner() {
  const { editGroupTrigger, updateEditGroupTrigger } = useContext(
    JobPlannerPageTriggerContext
  );
  const { checkUserState } = useRefreshUser();
  const { pageLoad } = useContext(PageLoadContext);
  const { loginInProgressComplete } = useContext(UserLoginUIContext);

  useEffect(() => {
    checkUserState();
  }, []);

  if (!loginInProgressComplete) {
    return <UserLogInUI />;
  } else {
    if (pageLoad) {
      return <LoadingPage />;
    } else {
      if (editGroupTrigger) {
        return (
          <Suspense fallback={<LoadingPage />}>
            <ShoppingListDialog />
            <PriceEntryDialog />
            <EditGroup updateEditGroupTrigger={updateEditGroupTrigger} />
          </Suspense>
        );
      } else {
        return (
          <Grid container sx={{ marginTop: "5px" }} spacing={2}>
            <ShoppingListDialog />
            <MassBuildFeedback />
            <PriceEntryDialog />
            <ESIOffline />
            <TutorialPlanner />
            <Grid item xs={12}>
              <SearchBar />
            </Grid>
            <Grid item xs={12}>
              <PlannerAccordion />
            </Grid>
          </Grid>
        );
      }
    }
  }
}
