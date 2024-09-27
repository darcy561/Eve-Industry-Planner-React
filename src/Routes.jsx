import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import { Home } from "./Components/Landing Page";
import { lazy, Suspense, useContext } from "react";
import { IsLoggedInContext } from "./Context/AuthContext";
import { LoadingPage } from "./Components/loadingPage";
import { getBoolean } from "firebase/remote-config";
import { remoteConfig } from "./firebase";
import GroupPage from "./Components/Job Planner/Groups/GroupPage";
import GroupPageFrame from "./Components/Groups/groupFrame";

const AuthMainUser = lazy(() => import("./Components/Auth/MainUserAuth"));
const JobPlannerPage = lazy(() =>
  import("./Components/Job Planner/JobPlanner")
);
const EditJobPage = lazy(() => import("./Components/Edit Job/editJob"));
const AccountsPage = lazy(() => import("./Components/Accounts/Accounts"));
const SettingsPage = lazy(() =>
  import("./Components/Settings/settingsSwitcher")
);
const BlueprintLibrary = lazy(() =>
  import("./Components/Blueprint Library/BlueprintLibrary")
);
const AssetLibrary = lazy(() => import("./Components/Assets/assets"));
const Dashboard = lazy(() => import("./Components/Dashboard/Dashboard"));
const UpcomingChanges = lazy(() =>
  import("./Components/Upcoming Changes/upcomingReleases")
);
const NewGroupPage = lazy(() =>
  import("./Components/Groups/New Group/newGroupPage")
);
const enableUpcomingChanges = getBoolean(
  remoteConfig,
  "enable_upcoming_changes_page"
);
export function NavRoutes({ colorMode }) {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingPage />}>
        <Routes>
          <Route path="/" element={<Home colorMode={colorMode} />} />
          <Route
            path="/jobplanner"
            element={<JobPlannerPage colorMode={colorMode} />}
          />
          <Route
            path="/editjob/:jobID"
            element={<EditJobPage colorMode={colorMode} />}
          />
          <Route
            path="/group/new"
            element={<NewGroupPage colorMode={colorMode} />}
          />
          <Route
            path="/group/:groupID"
            element={<GroupPageFrame colorMode={colorMode} />}
          />
          <Route
            path="/auth/"
            element={<AuthMainUser colorMode={colorMode} />}
          />
          {enableUpcomingChanges && (
            <Route
              path="/upcomingchanges"
              element={<UpcomingChanges colorMode={colorMode} />}
            />
          )}
          <Route element={<ProtectedRoute />}>
            <Route
              path="/dashboard"
              element={<Dashboard colorMode={colorMode} />}
            />
            <Route
              path="/accounts"
              element={<AccountsPage colorMode={colorMode} />}
            />
            <Route
              path="/settings"
              element={<SettingsPage colorMode={colorMode} />}
            />
            <Route
              path="/blueprint-library"
              element={<BlueprintLibrary colorMode={colorMode} />}
            />
            <Route
              path="/asset-library"
              element={<AssetLibrary colorMode={colorMode} />}
            />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

function ProtectedRoute() {
  const { isLoggedIn } = useContext(IsLoggedInContext);
  if (!isLoggedIn) {
    return <Navigate to="/" />;
  }
  return <Outlet />;
}
