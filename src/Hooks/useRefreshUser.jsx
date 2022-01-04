import { useCallback, useContext } from "react";
import { RefreshTokens } from "../Components/Auth/RefreshToken";
import { firebaseAuth } from "../Components/Auth/firebaseAuth";
import { useEveApi } from "./useEveApi";
import { useFirebase } from "./useFirebase";
import {
  ApiJobsContext,
  JobArrayContext,
  JobStatusContext,
} from "../Context/JobContext";
import {
  IsLoggedInContext,
  MainUserContext,
  UsersContext,
} from "../Context/AuthContext";
import { LoadingTextContext, PageLoadContext } from "../Context/LayoutContext";
import { trace } from "firebase/performance";
import { performance } from "../firebase";

export function useRefreshUser() {
  const { BlueprintLibrary, CharacterSkills, HistoricMarketOrders, IndustryJobs, MarketOrders, WalletTransactions, WalletJournal } =
    useEveApi();
  const { determineUserState } = useFirebase();
  const { setJobStatus } = useContext(JobStatusContext);
  const { updateJobArray } = useContext(JobArrayContext);
  const { updateApiJobs } = useContext(ApiJobsContext);
  const { updateUsers } = useContext(UsersContext);
  const { updateMainUser } = useContext(MainUserContext);
  const { updateIsLoggedIn } = useContext(IsLoggedInContext);
  const { updateLoadingText } = useContext(LoadingTextContext);
  const { updatePageLoad } = useContext(PageLoadContext);

  const refreshMainUser = useCallback(async (refreshToken) => {
    const t = trace(performance, "MainUserRefreshProcessFull");
    t.start();

    updateLoadingText((prevObj) => ({
      ...prevObj,
      eveSSO: true,
    }));

    const refreshedUser = await RefreshTokens(refreshToken);
    const fbToken = await firebaseAuth(refreshedUser);

    updateLoadingText((prevObj) => ({
      ...prevObj,
      eveSSOComp: true,
      charData: true,
    }));

    const charSettings = await determineUserState(refreshedUser, fbToken);
    refreshedUser.accountID = charSettings.accountID;
    refreshedUser.linkedJobs = charSettings.linkedJobs;
    refreshedUser.linkedTrans = charSettings.linkedTrans;
    refreshedUser.linkedOrders = charSettings.linkedOrders;

    updateLoadingText((prevObj) => ({
      ...prevObj,
      charDataComp: true,
      apiData: true,
    }));

    refreshedUser.apiSkills = await CharacterSkills(refreshedUser);
    refreshedUser.apiJobs = await IndustryJobs(refreshedUser);
    refreshedUser.apiOrders = await MarketOrders(refreshedUser);
    refreshedUser.apiHistOrders = await HistoricMarketOrders(refreshedUser);
    refreshedUser.apiBlueprints = await BlueprintLibrary(refreshedUser);
    refreshedUser.apiTransactions = await WalletTransactions(refreshedUser);
    refreshedUser.apiJournal = await WalletJournal(refreshedUser);


    updateLoadingText((prevObj) => ({
      ...prevObj,
      apiDataComp: true,
    }));

    console.log(refreshedUser);

    setJobStatus(charSettings.jobStatusArray);
    updateJobArray(charSettings.jobArraySnapshot);
    updateApiJobs(refreshedUser.apiJobs);
    const newUsersArray = [];
    newUsersArray.push(refreshedUser);
    updateUsers(newUsersArray);
    updateIsLoggedIn(true);
    updateMainUser(refreshedUser);
    t.stop();
    updateLoadingText((prevObj) => ({
      ...prevObj,
      eveSSO: false,
      eveSSOComp: false,
      charData: false,
      charDataComp: false,
      apiData: false,
      apiDataComp: false,
    }));
    updatePageLoad(false);
  });
  return { refreshMainUser };
}
