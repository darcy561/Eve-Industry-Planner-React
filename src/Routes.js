import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import { Header } from "./Components/Header";
import { Home } from "./Components/Landing Page";
import { JobPlanner } from "./Components/Job Planner";
import { ItemTree } from "./Components/item Tree";
import { AccountsPage } from "./Components/Accounts/Accounts";
import { SettingsPage } from "./Components/Settings/Settings";
import { Footer } from "./Components/Footer/Footer";
import { AuthMainUser } from "./Components/Auth/MainUserAuth";
import { useContext } from "react";
import { IsLoggedInContext } from "./Context/AuthContext";
import { Container } from "@mui/material";
import { BlueprintLibrary } from "./Components/Blueprint Library/BlueprintLibrary";
import { AssetLibrary } from "./Components/Assets/assets";

export function NavRoutes({ mode, colorMode }) {
  return (
    <BrowserRouter>
      <Container
        disableGutters
        maxWidth="false"
        sx={{ marigin: "0px", padding: "0px" }}
      >
        <Header mode={mode} colorMode={colorMode} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/jobplanner" element={<JobPlanner />} />
          <Route path="/auth/" element={<AuthMainUser />} />
          <Route path="/itemtree" element={<ItemTree />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/blueprint-library" element={<BlueprintLibrary />} />
            <Route path="/asset-library" element={<AssetLibrary />} />
          </Route>
        </Routes>
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
