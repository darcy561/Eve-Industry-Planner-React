import { lazy, Suspense, useContext, useEffect } from "react";
import { IsLoggedInContext } from "../../Context/AuthContext";
import { LoggedOutHome } from "./LoggedOut";
import { useRefreshUser } from "../../Hooks/useRefreshUser";
import { PageLoadContext } from "../../Context/LayoutContext";
import { LoadingPage } from "../loadingPage";
import { UserLogInUI } from "../Auth/LoginUI/LoginUI";


const Dashboard = lazy(() => import("../Dashboard/Dashboard"));

export function Home() {
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { checkUserState } = useRefreshUser();
  const { pageLoad } = useContext(PageLoadContext);

  useEffect(() => {
    checkUserState();
  }, []);

  if (pageLoad) {
    return <UserLogInUI/>
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
