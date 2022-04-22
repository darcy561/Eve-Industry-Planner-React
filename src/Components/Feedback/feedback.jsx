import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  TextField,
} from "@mui/material";
import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { firestore } from "../../firebase";

export function FeedbackIcon() {
  const [open, setOpen] = useState(false);
  const [inputText, updateInputText] = useState("");

  const handleSubmit = async () => {
    await setDoc(doc(firestore, "Feedback", Date.now().toString()), {
      response: inputText,
    });
    setOpen(false);
  };

  return (
    <>
      <Fab
        color="primary"
        size="small"
        variant="extended"
        sx={{ position: "fixed", bottom: "10px ", right: "5px" }}
        onClick={() => {
          setOpen(true);
        }}
      >
        Feedback
      </Fab>

      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
        }}
      >
        <DialogTitle color="primary" align="center">
          Feedback
        </DialogTitle>
        <DialogContent align="center">
          As development continues, I would love to hear back from you with
          ideas or thoughts regarding this application.{<br />}
          {<br />}Are there features you would like to see or are you having
          trouble doing something in particular?
        </DialogContent>
        <DialogActions>
          <TextField
            multiline
            minRows={5}
            fullWidth
            onChange={(e) => {
              updateInputText(e.target.value);
            }}
          />
        </DialogActions>
        <DialogActions>
          <Button
            onClick={() => {
              setOpen(false);
            }}
          >
            Close
          </Button>
          <Button variant="contained" onClick={handleSubmit}>
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
