import { JobStatus, JobArray, ActiveJob, ApiJobs } from "./Context/JobContext";
import { IsLoggedIn, Users } from "./Context/AuthContext";
import { EveESIStatus, EveIDs, EvePrices } from "./Context/EveDataContext";
import {
  DataExchange,
  DialogData,
  SnackbarData,
  PageLoad,
  LoadingText,
  ShoppingList,
  MultiSelectJobPlanner,
  RefreshState
} from "./Context/LayoutContext";
import LocalizationProvider from "@mui/lab/LocalizationProvider";
import AdapterDateFns from "@mui/lab/AdapterDateFns";
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
                                      <LocalizationProvider
                                        dateAdapter={AdapterDateFns}
                                      >
                                        <App />
                                      </LocalizationProvider>
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