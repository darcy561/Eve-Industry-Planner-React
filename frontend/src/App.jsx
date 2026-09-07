import { SnackBarNotification } from "./Components/snackbar";
import GeneralDialogue from "./Components/Dialogues/General/generalDialogue";
import JobDependencyTreeDialogue from "./Components/Dialogues/Job Tree/JobDependencyTreeDialogue";
import CssBaseline from "@mui/material/CssBaseline";
import { Outlet } from "@tanstack/react-router";
import { FeedbackIcon } from "./Components/Dialogues/Feedback/feedback";
import { CrashReportDialogue } from "./Components/Dialogues/CrashReport/CrashReportDialogue";
import GLOBAL_CONFIG from "./global-config-app";
import { Box } from "@mui/material";
import MaintenanceMode from "./MaintenanceMode";
import DefaultPageLayout from "./Styled Components/defaultPageLayout";
import PageTransition, { usePageKey } from "./Components/pageTransition";
import { ThemeProvider } from "./Context/ThemeContext";
import ErrorBoundary from "./Components/ErrorBoundary";
import useRefreshESITokens from "./Hooks/App/useRefreshESITokens";
import { useTranquilityServerStatusQuery } from "./Hooks/React Query/tranquilityServerStatus.js";
import useFetchStaticDataFiles from "./Hooks/App/useFetchStaticDataFiles";
import useAppConfig from "./Hooks/App/useAppConfig";
import useMaintenanceRealtimePark from "./Hooks/App/useMaintenanceRealtimePark.js";
import { useAccountWebSocket } from "./Realtime/useAccountWebSocket.js";
const { ENABLE_FEEDBACK_ICON } = GLOBAL_CONFIG;

export default function App() {
  const { maintenance_mode: isMaintenanceMode = false } = useAppConfig({
    shouldFetchOnMount: true,
    enableVersionCheck: true,
  });

  const pageKey = usePageKey(isMaintenanceMode);

  useMaintenanceRealtimePark(isMaintenanceMode);
  useRefreshESITokens();
  useAccountWebSocket();
  useTranquilityServerStatusQuery();
  useFetchStaticDataFiles();

  return (
    <ThemeProvider>
      <CrashReportDialogue />
      <Box sx={{ display: "flex", width: "100%", height: "100%" }}>
        <CssBaseline />
        <ErrorBoundary>
          <SnackBarNotification />
          <GeneralDialogue />
          <JobDependencyTreeDialogue />
          {isMaintenanceMode ? (
            <MaintenanceMode />
          ) : (
            <DefaultPageLayout>
              <PageTransition contentKey={pageKey}>
                <Outlet />
              </PageTransition>
              {ENABLE_FEEDBACK_ICON && <FeedbackIcon />}
            </DefaultPageLayout>
          )}
        </ErrorBoundary>
      </Box>
    </ThemeProvider>
  );
}
