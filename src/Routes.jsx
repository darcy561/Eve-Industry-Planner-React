import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import { Header } from "./Components/Header";
import { Home } from "./Components/Landing Page";
import { ItemTree } from "./Components/item Tree";
import { Footer } from "./Components/Footer/Footer";
import { lazy, Suspense, useContext } from "react";
import { JobPlanner } from "./Components/Job Planner";
import { IsLoggedInContext } from "./Context/AuthContext";
import { Container } from "@mui/material";
import { LoadingPage } from "./Components/loadingPage";

const AuthMainUser = lazy(() => import("./Components/Auth/MainUserAuth"));
const UpcomingChanges = lazy(() =>
  import("./Components/Upcoming Changes/upcomingReleases")
);
const AccountsPage = lazy(() => import("./Components/Accounts/Accounts"));
const SettingsPage = lazy(() => import("./Components/Settings/Settings"));
const BlueprintLibrary = lazy(() =>
  import("./Components/Blueprint Library/BlueprintLibrary")
);
const AssetLibrary = lazy(() => import("./Components/Assets/assets"));

export function NavRoutes({ mode, colorMode }) {
  return (
    <BrowserRouter>
      <Container
        disableGutters
        maxWidth="false"
        sx={{ marigin: "0px", padding: "0px" }}
      >
        <Header mode={mode} colorMode={colorMode} />
        <Suspense fallback={<LoadingPage />}>
          <Routes>
            <Route path="/" element={<Home />} />

            <Route path="/jobplanner" element={<JobPlanner />} />

            <Route path="/auth/" element={<AuthMainUser />} />
            <Route path="/itemtree" element={<ItemTree />} />
            <Route path="/upcoming-changes" element={<UpcomingChanges />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/accounts" element={<AccountsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/blueprint-library" element={<BlueprintLibrary />} />
              <Route path="/asset-library" element={<AssetLibrary />} />
            </Route>
          </Routes>
        </Suspense>
        <Footer />
      </Container>
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
