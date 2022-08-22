import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  FormControlLabel,
  Link,
  TextField,
} from "@mui/material";
import { useContext, useMemo, useState } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { firestore } from "../../firebase";
import { UsersContext } from "../../Context/AuthContext";
import { SnackBarDataContext } from "../../Context/LayoutContext";

export function FeedbackIcon() {
  const { users } = useContext(UsersContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const [open, setOpen] = useState(false);
  const [inputText, updateInputText] = useState("");
  const [dataDump, updateDataDump] = useState(false);

  const parentUser = useMemo(() => {
    return users.find((i) => i.ParentUser);
  }, [users]);

  const handleSubmit = async () => {
    let userAssets = () => {
      let assetList = [];
      for (let user of users) {
        assetList = assetList.concat(
          JSON.parse(sessionStorage.getItem(`assets_${user.CharacterHash}`))
        );
      }
      return assetList;
    };

    await setDoc(doc(firestore, "Feedback", Date.now().toString()), {
      accountID: parentUser.accountID || null,
      timestamp: serverTimestamp(),
      response: inputText,
      esiData: dataDump ? JSON.stringify(users) : null,
      assets: dataDump ? JSON.stringify(userAssets()) : null,
    });
    setOpen(false);
    setSnackbarData((prev) => ({
      ...prev,
      open: true,
      message: `Feedback Submitted`,
      severity: "success",
      autoHideDuration: 3000,
    }))
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
          trouble doing something in particular, include any contact details or
          join the{" "}
          <Link href="https://discord.gg/KGSa8gh37z" underline="hover">
            Discord
          </Link>{" "}
          if you would like further assistance.
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
          <FormControlLabel
            control={
              <Checkbox
                checked={dataDump}
                onChange={() => {
                  updateDataDump((prev) => !prev);
                }}
                sx={{ marginRight: { xs: "20px", sm: "60px" } }}
              />
            }
            label="Include ESI data?"
            labelPlacement="start"
          />
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
