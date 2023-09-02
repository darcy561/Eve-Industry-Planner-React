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
import { JobPlanner } from "./Components/Job Planner";
import { IsLoggedInContext } from "./Context/AuthContext";
import { LoadingPage } from "./Components/loadingPage";

// import { EditJob_New } from "./Components/Edit Job/editJob";

const AuthMainUser = lazy(() => import("./Components/Auth/MainUserAuth"));
const EditJobPage = lazy(() => import("./Components/Edit Job/editJob"));
const AccountsPage = lazy(() => import("./Components/Accounts/Accounts"));
const SettingsPage = lazy(() => import("./Components/Settings/Settings"));
const BlueprintLibrary = lazy(() =>
  import("./Components/Blueprint Library/BlueprintLibrary")
);
const AssetLibrary = lazy(() => import("./Components/Assets/assets"));
const Dashboard = lazy(() => import("./Components/Dashboard/Dashboard"));

export function NavRoutes({ mode, colorMode }) {
  return (
    <BrowserRouter>
      <Header mode={mode} colorMode={colorMode} />
      <Suspense fallback={<LoadingPage />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/jobplanner" element={<JobPlanner />} />
          <Route path="/editjob/:jobID" element={<EditJobPage />} />
          <Route path="/auth/" element={<AuthMainUser />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/blueprint-library" element={<BlueprintLibrary />} />
            <Route path="/asset-library" element={<AssetLibrary />} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
      <Footer />
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
