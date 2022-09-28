import { lazy, Suspense, useContext, useEffect } from "react";
import { IsLoggedInContext } from "../../Context/AuthContext";
import { LoggedOutHome } from "./LoggedOut";
import { useRefreshUser } from "../../Hooks/useRefreshUser";
import { PageLoadContext } from "../../Context/LayoutContext";
import { LoadingPage } from "../loadingPage";

const Dashboard = lazy(() => import("../Dashboard/Dashboard"));

export function Home() {
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { checkUserState } = useRefreshUser();
  const { pageLoad } = useContext(PageLoadContext);

  useEffect(() => {
    checkUserState();
  }, []);

  if (pageLoad) {
    return <LoadingPage />;
  } else {
    if (isLoggedIn) {
      return (
        <Suspense fallback={<LoadingPage />}>
          <Dashboard />;
        </Suspense>
      );
    } else {
      return <LoggedOutHome />;
    }
  }
}
