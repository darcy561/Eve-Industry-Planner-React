import { createFileRoute } from '@tanstack/react-router'
import { queryClient } from "../queryClient.js";
import { logoutPlannerSession } from "../Functions/Auth/sessionClient.js";
import { getTabPlannerRefreshToken } from "../Functions/Auth/tabSessionStorage.js";
import { clearPlannerAuthCookiesClientSide } from "../Functions/Auth/plannerAuthCookies.js";
import { disconnectRealtime } from "../Realtime/realtimeClient.js";
import { clearInboundJobDocumentCoalesce } from "../Functions/Debounce/inboundJobDocumentsCoalesce.js";
import useUsersStore from '../Zustand/usersStore'
import esiCredentials from "../Functions/Auth/esiCredentials/provider.js"
import { LoadingPage } from '../Components/loadingPage'
import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'

function clearClientSessionState() {
  const { resetJobDataStore } = useUsersStore.getState().jobData.actions;
  const { resetApplicationSettingsStore } = useUsersStore.getState()
    .applicationSettings.actions;
  const { resetAccountStore } = useUsersStore.getState().account.actions;
  const { resetWorldDataStore } = useUsersStore.getState().worldData.actions;

  // Drop module-level WS coalesce queues before zustand resets; pending job upserts can
  // still flush and repopulate job data after `resetJobDataStore` if not cleared.
  clearInboundJobDocumentCoalesce();
  // Clear session first so in-flight account GETs (e.g. syncAccountDocumentsFromServer) cannot
  // re-merge application_settings after we clear them in the same tick.
  resetAccountStore();
  resetJobDataStore();
  resetApplicationSettingsStore();
  resetWorldDataStore();
  clearPlannerAuthCookiesClientSide();
  // Held ESI access tokens live outside the store, so no slice reset drops them.
  esiCredentials.reset();
}

function SignoutComponent() {
  const navigate = useNavigate();
  useEffect(() => {
    async function performSignout() {
      try {
        disconnectRealtime();
        await logoutPlannerSession(getTabPlannerRefreshToken());

        clearClientSessionState();
        queryClient.clear();

        // Clear storage
        sessionStorage.clear();
        localStorage.removeItem("Auth");
        localStorage.removeItem("originalPath");

        // Navigate to home page
        navigate({ to: "/" });

      } catch (error) {
        console.error("Signout error:", error);

        clearClientSessionState();
        queryClient.clear();
        sessionStorage.clear();
        localStorage.removeItem("Auth");
        localStorage.removeItem("originalPath");
        window.location.href = "/";
      }
    }

    performSignout();
  }, [navigate]);

  return <LoadingPage variant="route" />;
}

export const Route = createFileRoute('/signout')({
  component: SignoutComponent,
})