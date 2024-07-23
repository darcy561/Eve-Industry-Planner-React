import { createContext, useState } from "react";
import ApplicationSettingsObject from "../Classes/applicationSettingsConstructor";



export const DataExchangeContext = createContext();

export const DataExchange = (props) => {
  const [DataExchange, updateDataExchange] = useState(false);

  return (
    <DataExchangeContext.Provider value={{ DataExchange, updateDataExchange }}>
      {props.children}
    </DataExchangeContext.Provider>
  );
};

export const SnackBarDataContext = createContext();

export const SnackbarData = (props) => {
  const [snackbarData, setSnackbarData] = useState({
    anchorOrigin: { vertical: "bottom", horizontal: "center" },
    autoHideDuration: 3000,
    direction: "up",
    key: Date.now(),
    message: "",
    open: false,
    severity: "",
    variant: "filled",
  });

  return (
    <SnackBarDataContext.Provider value={{ snackbarData, setSnackbarData }}>
      {props.children}
    </SnackBarDataContext.Provider>
  );
};

export const DialogDataContext = createContext();

export const DialogData = (props) => {
  const [dialogData, updateDialogData] = useState({
    buttontext: "",
    id: "",
    open: false,
    title: "",
    body: "",
  });

  return (
    <DialogDataContext.Provider value={{ dialogData, updateDialogData }}>
      {props.children}
    </DialogDataContext.Provider>
  );
};

export const ShoppingListContext = createContext();

export const ShoppingList = (props) => {
  const [shoppingListTrigger, updateShoppingListTrigger] = useState(false);
  const [shoppingListData, updateShoppingListData] = useState([]);

  return (
    <ShoppingListContext.Provider
      value={{
        shoppingListTrigger,
        shoppingListData,
        updateShoppingListTrigger,
        updateShoppingListData,
      }}
    >
      {props.children}
    </ShoppingListContext.Provider>
  );
};

export const PriceEntryListContext = createContext();

export const PriceEntryList = (props) => {
  const [priceEntryListData, updatePriceEntryListData] = useState({
    open: false,
    list: [],
    displayMarket: null,
    displayOrder: null,
  });

  return (
    <PriceEntryListContext.Provider
      value={{ priceEntryListData, updatePriceEntryListData }}
    >
      {props.children}
    </PriceEntryListContext.Provider>
  );
};

export const MultiSelectJobPlannerContext = createContext();

export const MultiSelectJobPlanner = (props) => {
  const [multiSelectJobPlanner, updateMultiSelectJobPlanner] = useState([]);

  return (
    <MultiSelectJobPlannerContext.Provider
      value={{ multiSelectJobPlanner, updateMultiSelectJobPlanner }}
    >
      {props.children}
    </MultiSelectJobPlannerContext.Provider>
  );
};

export const PageLoadContext = createContext();

export const PageLoad = (props) => {
  const [pageLoad, updatePageLoad] = useState(true);

  return (
    <PageLoadContext.Provider value={{ pageLoad, updatePageLoad }}>
      {props.children}
    </PageLoadContext.Provider>
  );
};

export const LoadingTextContext = createContext();

export const LoadingText = (props) => {
  const [loadingText, updateLoadingText] = useState({
    eveSSO: false,
    eveSSOComp: false,
    charData: false,
    charDataComp: false,
    apiData: false,
    apiDataComp: false,
    jobData: false,
    jobDataComp: false,
    priceData: false,
    priceDataComp: false,
  });

  return (
    <LoadingTextContext.Provider value={{ loadingText, updateLoadingText }}>
      {props.children}
    </LoadingTextContext.Provider>
  );
};

export const RefreshStateContext = createContext();

export const RefreshState = (props) => {
  const [refreshState, updateRefreshState] = useState(1);

  return (
    <RefreshStateContext.Provider value={{ refreshState, updateRefreshState }}>
      {props.children}
    </RefreshStateContext.Provider>
  );
};

export const MassBuildDisplayContext = createContext();

export const MassBuildDisplay = (props) => {
  const [massBuildDisplay, updateMassBuildDisplay] = useState({
    open: false,
    currentJob: 0,
    totalJob: 0,
    totalPrice: 0,
  });

  return (
    <MassBuildDisplayContext.Provider
      value={{ massBuildDisplay, updateMassBuildDisplay }}
    >
      {props.children}
    </MassBuildDisplayContext.Provider>
  );
};

export const JobPlannerPageTriggerContext = createContext();

export const JobPlannerPageTrigger = (props) => {
  const [editGroupTrigger, updateEditGroupTrigger] = useState(false);

  return (
    <JobPlannerPageTriggerContext.Provider
      value={{
        editGroupTrigger,
        updateEditGroupTrigger,
      }}
    >
      {props.children}
    </JobPlannerPageTriggerContext.Provider>
  );
};

export const ApplicationSettingsContext = createContext();

export const ApplicationSettings = (props) => {
  const [applicationSettings, updateApplicationSettings] = useState(
    new ApplicationSettingsObject()
  );

  return (
    <ApplicationSettingsContext.Provider
      value={{ applicationSettings, updateApplicationSettings }}
    >
      {props.children}
    </ApplicationSettingsContext.Provider>
  );
};

export const UserLoginUIContext = createContext();

export const UserLoginUI = (props) => {
  const [loginInProgressComplete, updateLoginInProgressComplete] =
    useState(false);
  const [userUIData, updateUserUIData] = useState({
    returnState: "",
    userArray: [],
    eveLoginComplete: false,
  });
  const [userDataFetch, updateUserDataFetch] = useState(false);
  const [userJobSnapshotDataFetch, updateUserJobSnapshotDataFetch] =
    useState(false);
  const [userWatchlistDataFetch, updateUserWatchlistDataFetch] =
    useState(false);
  const [userGroupsDataFetch, updateUserGroupsDataFetch] = useState(false);

  return (
    <UserLoginUIContext.Provider
      value={{
        loginInProgressComplete,
        updateLoginInProgressComplete,
        userUIData,
        updateUserUIData,
        userDataFetch,
        updateUserDataFetch,
        userJobSnapshotDataFetch,
        updateUserJobSnapshotDataFetch,
        userWatchlistDataFetch,
        updateUserWatchlistDataFetch,
        userGroupsDataFetch,
        updateUserGroupsDataFetch,
      }}
    >
      {props.children}
    </UserLoginUIContext.Provider>
  );
};
