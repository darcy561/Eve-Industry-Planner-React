import { lazy, useContext, Suspense, useState } from "react";
import { PlannerAccordion } from "./Planner Components/accordion";
import {
  JobPlannerPageTriggerContext,
  PageLoadContext,
  UserLoginUIContext,
} from "../../Context/LayoutContext";
import { LoadingPage } from "../loadingPage";
import { SearchBar } from "./Planner Components/searchbar";
import { AppBar, Box, Grid, Toolbar } from "@mui/material";
import { TutorialContent_JobPlanner } from "./Planner Components/tutorialPlanner";
import { ShoppingListDialog } from "./Dialogues/ShoppingList/ShoppingList";
import { PriceEntryDialog } from "./Dialogues/PriceEntry/PriceEntryList";
import { MassBuildFeedback } from "./Planner Components/massBuildInfo";
import { ESIOffline } from "../offlineNotification";
import { UserLogInUI } from "../Auth/LoginUI/LoginUI";
import { Header } from "../Header";
import CollapseableMenuDrawer from "../SideMenu/leftMenuDrawer";
import { SideMenuContent_JobPlanner } from "./Planner Components/Side Menu/sideMenuContent";
import TutorialTemplate from "../Tutorials/tutorialTemplate";
import { Footer } from "../Footer/Footer";
import useCheckUserAuthState from "../../Hooks/Auth Hooks/useCheckUserState";
import CollapseableContentDrawer_Right from "../SideMenu/rightContentDrawer";

const EditGroup = lazy(() => import("./Groups/GroupPage"));

export default function JobPlanner({ colorMode }) {
  const { editGroupTrigger, updateEditGroupTrigger } = useContext(
    JobPlannerPageTriggerContext
  );
  const { pageLoad } = useContext(PageLoadContext);
  const { loginInProgressComplete } = useContext(UserLoginUIContext);
  const [expandRightContentMenu, updateExpandRightContentMenu] =
    useState(false);
  const tutorialContent = (
    <TutorialTemplate/>
  );
  useCheckUserAuthState();

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
          <>
            <Header colorMode={colorMode} />
            {/* <SearchBar /> */}
            <CollapseableMenuDrawer
              expandRightContentMenu={expandRightContentMenu}
              updateExpandRightContentMenu={updateExpandRightContentMenu}
              DrawerContents={SideMenuContent_JobPlanner}
            />

            <Box
              component="main"
              sx={{
                minHeight: "100vh",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                paddingTop: 10,
                paddingX: 2,
                gap: 2,
              }}
            >
              <ESIOffline />

              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", md: "row" },
                  justifyContent: { xs: "center", md: "flex-start" },
                  gap: 2,
                  width: "100%",
                  flex: 1,
                }}
              >
                <PlannerAccordion />

                <TutorialTemplate
                  TutorialContent={TutorialContent_JobPlanner}
                />
              </Box>

              <Footer />
            </Box>
            <CollapseableContentDrawer_Right
              // DrawerContent={
              //   <Box>
              //     sff
              //   </Box>
              // }
              expandRightContentMenu={expandRightContentMenu}
              updateExpandRightContentMenu={updateExpandRightContentMenu}
            />
            <ShoppingListDialog />
            <MassBuildFeedback />
            <PriceEntryDialog />
          </>
        );
      }
    }
  }
}
