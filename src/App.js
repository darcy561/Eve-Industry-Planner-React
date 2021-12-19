import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Header } from "./Components/Header";
import { Home } from "./Components/Home";
import { JobPlanner } from "./Components/Job Planner";
import { ItemTree } from "./Components/item Tree";
import { JobStatus, JobArray, ActiveJob, ApiJobs } from "./Context/JobContext";
import { AuthMainUser } from "./Components/Auth/MainUserAuth";
import { IsLoggedIn, MainUser, Users } from "./Context/AuthContext";
import { ThemeProvider, createTheme, responsiveFontSizes } from "@mui/material/styles";
import { SnackBarNotification } from "./Components/snackbar";
import { DialogBox } from "./Components/dialog";
import {
  DataExchange,
  DialogData,
  SnackbarData,
  PageLoad,
  LoadingText,
} from "./Context/LayoutContext";
import { blue, blueGrey, deepPurple, grey, lightGreen} from "@mui/material/colors";

let theme = createTheme({
    palette: {
      type: 'light',
      primary: {
        main: blue[600],
      },
      secondary: {
        main: grey[600],
    },
    manufacturing: {
        main: lightGreen[200],
    },
    reaction: {
      main: deepPurple[100],
    },
    pi: {
      main: blue[100],
    },
    baseMat: {
      main: blueGrey[100]
    }
  },
  typography: {
    fontFamily: 'Montserrat',
  },
  }
);
theme = responsiveFontSizes(theme);

export default function App() {
  return (
      <ThemeProvider theme={theme}>
        <SnackbarData>
          <DialogData>
            <PageLoad>
              <LoadingText>
                <IsLoggedIn>
                  <MainUser>
                    <Users>
                      <DataExchange>
                        <ActiveJob>
                          <JobArray>
                            <JobStatus>
                              <ApiJobs>
                                <SnackBarNotification />
                                <DialogBox />
                                <BrowserRouter>
                                  <Header />
                                  <Routes>
                                    <Route path="/" element={<Home />} />
                                    <Route
                                      path="/jobplanner"
                                      element={<JobPlanner />}
                                    />
                                    <Route
                                      path="/auth/"
                                      element={<AuthMainUser />}
                                    />
                                    <Route
                                      path="/itemtree"
                                      element={<ItemTree />}
                                    />
                                  </Routes>
                                </BrowserRouter>
                              </ApiJobs>
                            </JobStatus>
                          </JobArray>
                        </ActiveJob>
                      </DataExchange>
                    </Users>
                  </MainUser>
                </IsLoggedIn>
              </LoadingText>
            </PageLoad>
          </DialogData>
        </SnackbarData>
      </ThemeProvider>
  );
}
