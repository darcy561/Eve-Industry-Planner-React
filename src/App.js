import { useMemo, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Header } from "./Components/Header";
import { Home } from "./Components/Home";
import { JobPlanner } from "./Components/Job Planner";
import { ItemTree } from "./Components/item Tree";
import { JobStatus, JobArray, ActiveJob, ApiJobs } from "./Context/JobContext";
import { AuthMainUser } from "./Components/Auth/MainUserAuth";
import { IsLoggedIn, Users } from "./Context/AuthContext";
import { EveIDs } from "./Context/EveDataContext";
import {
  ThemeProvider,
  createTheme,
  responsiveFontSizes,
} from "@mui/material/styles";
import { SnackBarNotification } from "./Components/snackbar";
import { DialogBox } from "./Components/dialog";
import {
  DataExchange,
  DialogData,
  SnackbarData,
  PageLoad,
  LoadingText,
  ShoppingList  
} from "./Context/LayoutContext";
import {
  blue,
  blueGrey,
  deepPurple,
  grey,
  lightGreen,
} from "@mui/material/colors";
import CssBaseline from "@mui/material/CssBaseline";
import { AccountsPage } from "./Components/Accounts/Accounts";
import { SettingsPage } from "./Components/Settings/Settings";
import { Footer } from "./Components/Footer/Footer";

export default function App() {
  const [mode, setMode] = useState(localStorage.getItem("theme"));

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === "light" || prevMode === null ? "dark" : "light"));
      },
    }),
    []
  );

  const getDesignTokens = (mode) => (
    {
    palette: {
      typography: {
        fontFamily: "Montserrat",
      },
      ...(mode === "light" || mode === null
        ? {
            type: "light",
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
              main: blueGrey[100],
            },
          }
        : {
            type: "dark",
            primary: {
              main: blue[600],
            },
            secondary: {
              main: grey[200],
            },
            manufacturing: {
              main: lightGreen[300],
            },
            reaction: {
              main: deepPurple[300],
            },
            pi: {
              main: blue[100],
            },
            baseMat: {
              main: blueGrey[100],
            },
            background: {
              default: grey[900],
              paper: grey[800],
            },
            text: {
              primary: grey[200],
              secondary: grey[800],
              disabled: grey[200],
              hint: grey[200],
            },
          divider: grey[700],
          }),
    },
  });

  let theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);
  theme = responsiveFontSizes(theme);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarData>
        <DialogData>
          <PageLoad>
            <LoadingText>
              <IsLoggedIn>
                  <Users>
                    <DataExchange>
                      <ActiveJob>
                        <JobArray>
                          <JobStatus>
                            <ApiJobs>
                            <EveIDs>
                              <ShoppingList>
                                <SnackBarNotification />
                                <DialogBox />
                                <BrowserRouter>
                                  <Header mode={mode} colorMode={colorMode} />
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
                                    <Route
                                      path="/accounts"
                                      element={<AccountsPage />}
                                    />
                                    <Route
                                      path="/settings"
                                      element={<SettingsPage />}
                                    />
                                  </Routes>
                                  <Footer />
                                </BrowserRouter>
                                </ShoppingList>
                              </EveIDs>
                            </ApiJobs>
                          </JobStatus>
                        </JobArray>
                      </ActiveJob>
                    </DataExchange>
                  </Users>
              </IsLoggedIn>
            </LoadingText>
          </PageLoad>
        </DialogData>
      </SnackbarData>
    </ThemeProvider>
  );
}
