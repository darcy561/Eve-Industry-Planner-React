import React from 'react';
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { Header } from "./Components/Header";
import { Home } from "./Components/Home";
import { JobPlanner } from "./Components/Job Planner";
import { ItemTree } from "./Components/item Tree";
import {
  JobStatus,
  JobArray,
  ActiveJob,
  JobSettingsTrigger,
  SelectedPage,
} from "./Context/JobContext";
import { AuthMainUser, AuthToken } from "./Components/Auth/MainUserAuth";
import { IsLoggedIn, MainUser, Users } from "./Context/AuthContext";
import { ThemeProvider } from "@material-ui/styles";
import { createTheme } from "@material-ui/core";
import { SnackBarNotification } from './Components/snackbar';
import { DataExchange, SnackbarData } from './Context/LayoutContext';

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

function App() {
  return (
    <>
      <ThemeProvider theme={theme}>
        <Router>
          <Switch>
            <SnackbarData>
            <IsLoggedIn>
              <MainUser>
              <Users>
                <DataExchange>
                  <JobSettingsTrigger>
                    <ActiveJob>
                      <JobArray>
                          <JobStatus>
                          <SnackBarNotification/>
                          <Header />
                          <Route path="/" exact component={Home} />
                          <Route
                            path="/jobplanner"
                            exact
                            component={JobPlanner}
                          />
                          <Route path="/auth/" exact component={AuthMainUser} />
                                <Route path="/itemtree" exact component={ItemTree} />
                        </JobStatus>
                      </JobArray>
                    </ActiveJob>
                  </JobSettingsTrigger>
                  </DataExchange>
                </Users>
                </MainUser>
            </IsLoggedIn>
            </SnackbarData>
          </Switch>
        </Router>
      </ThemeProvider>
    </>
  );
}

export default App;
