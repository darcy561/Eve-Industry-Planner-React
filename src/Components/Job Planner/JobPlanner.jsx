import {
  lazy,
  useContext,
  useEffect,
  useState,
  Suspense,
  useMemo,
} from "react";
import { UsersContext } from "../../Context/AuthContext";
import { PlannerAccordion } from "./Planner Components/accordion";
import { useRefreshUser } from "../../Hooks/useRefreshUser";
import { PageLoadContext } from "../../Context/LayoutContext";
import { LoadingPage } from "../loadingPage";
import { SearchBar } from "./Planner Components/searchbar";
import { Grid } from "@mui/material";
import { TutorialPlanner } from "./Planner Components/tutorialPlanner";
import { ShoppingListDialog } from "./Dialogues/ShoppingList/ShoppingList";
import { PriceEntryDialog } from "./Dialogues/PriceEntry/PriceEntryList";
import { MassBuildFeedback } from "./Planner Components/massBuildInfo";
import { ESIOffline } from "../offlineNotification";

const EditJob = lazy(() => import("./Edit Job/EditJob"));

export function JobPlanner() {
  const [jobSettingsTrigger, updateJobSettingsTrigger] = useState(false);
  const [shoppingListTrigger, updateShoppingListTrigger] = useState(false);
  const [shoppingListData, updateShoppingListData] = useState([]);
  const { users } = useContext(UsersContext);
  const { checkUserState } = useRefreshUser();
  const { pageLoad } = useContext(PageLoadContext);

  let parentUser = useMemo(() => {
    return users.find((u) => u.ParentUser);
  }, [users]);

  useEffect(() => {
    checkUserState();
  }, []);

  if (pageLoad) {
    return <LoadingPage />;
  } else {
    if (jobSettingsTrigger) {
      return (
        <Suspense fallback={<LoadingPage />}>
          <ShoppingListDialog
            shoppingListTrigger={shoppingListTrigger}
            updateShoppingListTrigger={updateShoppingListTrigger}
            shoppingListData={shoppingListData}
            updateShoppingListData={updateShoppingListData}
          />
          <MassBuildFeedback />
          <EditJob
            updateJobSettingsTrigger={updateJobSettingsTrigger}
            updateShoppingListTrigger={updateShoppingListTrigger}
            updateShoppingListData={updateShoppingListData}
          />
        </Suspense>
      );
    } else {
      return (
        <Grid container sx={{ marginTop: "5px" }} spacing={2}>
          <ShoppingListDialog
            shoppingListTrigger={shoppingListTrigger}
            updateShoppingListTrigger={updateShoppingListTrigger}
            shoppingListData={shoppingListData}
            updateShoppingListData={updateShoppingListData}
          />

          <MassBuildFeedback />
          <PriceEntryDialog />

          <ESIOffline />

          {!parentUser.settings.layout.hideTutorials && (
            <Grid item xs={12}>
              <TutorialPlanner />
            </Grid>
          )}
          <Grid item xs={12}>
            <SearchBar
              updateShoppingListTrigger={updateShoppingListTrigger}
              updateShoppingListData={updateShoppingListData}
            />
          </Grid>
          <Grid item xs={12}>
            <PlannerAccordion
              updateJobSettingsTrigger={updateJobSettingsTrigger}
            />
          </Grid>
        </Grid>
      );
    }
  }
}
