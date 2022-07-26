import {
  JobStatus,
  JobArray,
  ActiveJob,
  ApiJobs,
  ArchivedJobs,
} from "./Context/JobContext";
import { IsLoggedIn, Users } from "./Context/AuthContext";
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
  ShoppingList,
  MultiSelectJobPlanner,
  RefreshState,
  PriceEntryList,
  MassBuildDisplay,
} from "./Context/LayoutContext";
import { LocalizationProvider } from "@mui/x-date-pickers"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import App from "./App";

export function AppWrapper() {
  return (
    <SnackbarData>
      <DialogData>
        <PageLoad>
          <LoadingText>
            <RefreshState>
              <IsLoggedIn>
                <Users>
                  <DataExchange>
                    <ActiveJob>
                      <JobArray>
                        <JobStatus>
                          <ApiJobs>
                            <EveIDs>
                              <EveESIStatus>
                                <EvePrices>
                                  <MultiSelectJobPlanner>
                                    <ShoppingList>
                                      <PriceEntryList>
                                        <SisiDataFiles>
                                          <MassBuildDisplay>
                                            <ArchivedJobs>
                                              <LocalizationProvider
                                                dateAdapter={AdapterDateFns}
                                              >
                                                <App />
                                              </LocalizationProvider>
                                            </ArchivedJobs>
                                          </MassBuildDisplay>
                                        </SisiDataFiles>
                                      </PriceEntryList>
                                    </ShoppingList>
                                  </MultiSelectJobPlanner>
                                </EvePrices>
                              </EveESIStatus>
                            </EveIDs>
                          </ApiJobs>
                        </JobStatus>
                      </JobArray>
                    </ActiveJob>
                  </DataExchange>
                </Users>
              </IsLoggedIn>
            </RefreshState>
          </LoadingText>
        </PageLoad>
      </DialogData>
    </SnackbarData>
  );
}
