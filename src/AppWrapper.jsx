import {
  JobStatus,
  JobArray,
  ActiveJob,
  ApiJobs,
  ArchivedJobs,
  LinkedIDs,
} from "./Context/JobContext";
import {
  FirebaseListeners,
  IsLoggedIn,
  UserJobSnapshot,
  Users,
  UserWatchlist,
} from "./Context/AuthContext";
import {
  EveESIStatus,
  EveIDs,
  EvePrices,
  SisiDataFiles,
} from "./Context/EveDataContext";
import {
  DataExchange,
  DialogData,
  SnackbarData,
  PageLoad,
  LoadingText,
  MultiSelectJobPlanner,
  RefreshState,
  PriceEntryList,
  MassBuildDisplay,
} from "./Context/LayoutContext";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import App from "./App";

export function AppWrapper() {
  return (
    <FirebaseListeners>
      <SnackbarData>
        <DialogData>
          <PageLoad>
            <LoadingText>
              <RefreshState>
                <IsLoggedIn>
                  <Users>
                    <LinkedIDs>
                      <UserJobSnapshot>
                        <UserWatchlist>
                          <DataExchange>
                            <ActiveJob>
                              <JobArray>
                                <JobStatus>
                                  <ApiJobs>
                                    <EveIDs>
                                      <EveESIStatus>
                                        <EvePrices>
                                          <MultiSelectJobPlanner>
                                            <PriceEntryList>
                                              <SisiDataFiles>
                                                <MassBuildDisplay>
                                                  <ArchivedJobs>
                                                    <LocalizationProvider
                                                      dateAdapter={
                                                        AdapterDateFns
                                                      }
                                                    >
                                                      <App />
                                                    </LocalizationProvider>
                                                  </ArchivedJobs>
                                                </MassBuildDisplay>
                                              </SisiDataFiles>
                                            </PriceEntryList>
                                          </MultiSelectJobPlanner>
                                        </EvePrices>
                                      </EveESIStatus>
                                    </EveIDs>
                                  </ApiJobs>
                                </JobStatus>
                              </JobArray>
                            </ActiveJob>
                          </DataExchange>
                        </UserWatchlist>
                      </UserJobSnapshot>
                    </LinkedIDs>
                  </Users>
                </IsLoggedIn>
              </RefreshState>
            </LoadingText>
          </PageLoad>
        </DialogData>
      </SnackbarData>
    </FirebaseListeners>
  );
}
