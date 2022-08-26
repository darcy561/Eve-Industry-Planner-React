import { useContext, useEffect } from "react";
import { IsLoggedInContext } from "../../Context/AuthContext";
import { Dashboard } from "../Dashboard/Dashboard";
import { LoggedOutHome } from "./LoggedOut";
import { useRefreshUser } from "../../Hooks/useRefreshUser";
import { PageLoadContext } from "../../Context/LayoutContext";
import { LoadingPage } from "../loadingPage";

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
      return <Dashboard />;
    } else {
      return <LoggedOutHome />;
    }
  }
}
