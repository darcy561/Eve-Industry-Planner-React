import { lazy, Suspense, useContext, useEffect } from "react";
import { IsLoggedInContext, UserJobSnapshotContext, UsersContext, UserWatchlistContext } from "../../Context/AuthContext";
import { LoggedOutHome } from "./LoggedOut";
import { useRefreshUser } from "../../Hooks/useRefreshUser";
import {
  PageLoadContext,
  UserLoginUIContext,
} from "../../Context/LayoutContext";
import { LoadingPage } from "../loadingPage";
import { UserLogInUI } from "../Auth/LoginUI/LoginUI";

const Dashboard = lazy(() => import("../Dashboard/Dashboard"));

export function Home() {
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { checkUserState } = useRefreshUser();
  const { pageLoad } = useContext(PageLoadContext);
  const { logInProcessComplete, updateLoginInProgressComplete } = useContext(UserLoginUIContext);
  const { userDataFetch } = useContext(UsersContext);
  const { userJobSnapshotDataFetch } = useContext(UserJobSnapshotContext);
  const { userWatchlistDataFetch } = useContext(UserWatchlistContext);

  useEffect(() => {
    checkUserState();
  }, []);
  useEffect(() => {
    if (userWatchlistDataFetch && userJobSnapshotDataFetch && userDataFetch) {
      updateLoginInProgressComplete(true);
    }
  }, [userWatchlistDataFetch, userJobSnapshotDataFetch, userDataFetch]);

  if (logInProcessComplete) {
    return <UserLogInUI />;
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
