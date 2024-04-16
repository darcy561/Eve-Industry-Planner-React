import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import { Header } from "./Components/Header";
import { Home } from "./Components/Landing Page";
import { Footer } from "./Components/Footer/Footer";
import { lazy, Suspense, useContext } from "react";
import { IsLoggedInContext } from "./Context/AuthContext";
import { LoadingPage } from "./Components/loadingPage";
import { Box } from "@mui/material";

const AuthMainUser = lazy(() => import("./Components/Auth/MainUserAuth"));
const JobPlannerPage = lazy(() =>
  import("./Components/Job Planner/JobPlanner")
);
const EditJobPage = lazy(() => import("./Components/Edit Job/editJob"));
const AccountsPage = lazy(() => import("./Components/Accounts/Accounts"));
const SettingsPage = lazy(() => import("./Components/Settings/Settings"));
const BlueprintLibrary = lazy(() =>
  import("./Components/Blueprint Library/BlueprintLibrary")
);
const AssetLibrary = lazy(() => import("./Components/Assets/assets"));
const Dashboard = lazy(() => import("./Components/Dashboard/Dashboard"));

export function NavRoutes({ colorMode }) {
  return (
    <BrowserRouter>
      {/* <Header mode={mode} colorMode={colorMode} /> */}
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
            path="/auth/"
            element={<AuthMainUser colorMode={colorMode} />}
          />
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
      {/* <Footer /> */}
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
