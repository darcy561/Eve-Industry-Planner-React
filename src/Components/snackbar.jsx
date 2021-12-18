import React,{ useContext} from "react";
import { Alert, Snackbar, Slide } from '@mui/material';
import { SnackBarDataContext } from "../Context/LayoutContext";

export function SnackBarNotification() {
  const { snackbarData, setSnackbarData } = useContext(SnackBarDataContext)
  
    function handleSnackbarClose (event, reason){
      if (reason === 'clickaway') {
          return;
        };
      setSnackbarData((prev) => ({
          ...prev, open: false
        }));
      };
    
      const slideTransition = (props) => {
        return <Slide {...props} direction={snackbarData.direction}/>;
      };
  if (snackbarData.open) {
    return (
      <Snackbar
        anchorOrigin={snackbarData.anchorOrigin}
        autoHideDuration={snackbarData.autoHideDuration}
        key={snackbarData.key}
        open={snackbarData.open}
        onClose={handleSnackbarClose}
        TransitionComponent={slideTransition}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarData.severity} sx={{ width: "100%" }}
          variant={snackbarData.variant}
        >
          {snackbarData.message}
        </Alert>
      </Snackbar>
    )
  } else {
    return null
  }
}