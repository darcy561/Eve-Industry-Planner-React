import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Header } from "./Components/Header";
import { Home } from "./Components/Home";
import { JobPlanner } from "./Components/Job Planner";
import { ItemTree } from "./Components/item Tree";
import { JobStatus, JobArray, ActiveJob } from "./Context/JobContext";
import { AuthMainUser } from "./Components/Auth/MainUserAuth";
import { IsLoggedIn, MainUser, Users } from "./Context/AuthContext";
import { ThemeProvider } from "@material-ui/styles";
import { createTheme } from "@material-ui/core";
import { SnackBarNotification } from "./Components/snackbar";
import { DialogBox } from "./Components/dialog";
import {
  DataExchange,
  DialogData,
  SnackbarData,
} from "./Context/LayoutContext";

const theme = createTheme({
  root: {
    background: "none",
  },
  palette: {
    primary: {
      main: "rgba(196, 143, 36)",
    },
    secondary: {
      main: "#E0E0E0",
    },
  },
  typography: {
    fontFamily: ["Montserrat", "Orbitron"].join(","),
    h4: {
      fontFamily: "Orbitron",
      color: "rgba(196, 143, 36);",
    },
    h6: {
      color: "#E0E0E0",
      fontSize: "0.9vw",
    },
    body1: {
      color: "#423f3f",
      fontSize: "1rem",
    },
    body2: {
      color: "#E0E0E0",
      fontSize: "1rem",
    },
  },
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <SnackbarData>
        <DialogData>
          <IsLoggedIn>
            <MainUser>
              <Users>
                <DataExchange>
                  <ActiveJob>
                    <JobArray>
                      <JobStatus>
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
                            <Route path="/auth/" element={<AuthMainUser />} />
                            <Route path="/itemtree" element={<ItemTree />} />
                          </Routes>
                        </BrowserRouter>
                      </JobStatus>
                    </JobArray>
                  </ActiveJob>
                </DataExchange>
              </Users>
            </MainUser>
          </IsLoggedIn>
        </DialogData>
      </SnackbarData>
    </ThemeProvider>
  );
}
