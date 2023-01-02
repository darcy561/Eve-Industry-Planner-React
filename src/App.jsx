import { useMemo, useState } from "react";
import {
  ThemeProvider,
  createTheme,
  responsiveFontSizes,
} from "@mui/material/styles";
import { SnackBarNotification } from "./Components/snackbar";
import { DialogBox } from "./Components/dialog";
import {
  blue,
  blueGrey,
  deepPurple,
  grey,
  lightGreen,
  yellow,
} from "@mui/material/colors";
import CssBaseline from "@mui/material/CssBaseline";
import { NavRoutes } from "./Routes";
import { FeedbackIcon } from "./Components/Feedback/feedback";

export default function App() {
  const [mode, setMode] = useState(localStorage.getItem("theme"));
  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) =>
          prevMode === "light" || prevMode === null ? "dark" : "light"
        );
      },
    }),
    []
  );

  const getDesignTokens = (mode) => ({
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
            groupJob: {
              main: yellow[600],
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
            groupJob: {
              main: yellow[600],
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
      <SnackBarNotification />
      <DialogBox />
      <NavRoutes mode={mode} colorMode={colorMode} />
      <FeedbackIcon />
    </ThemeProvider>
  );
}
