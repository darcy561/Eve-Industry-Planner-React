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
import { functions } from "../../firebase";
import { UsersContext } from "../../Context/AuthContext";
import { SnackBarDataContext } from "../../Context/LayoutContext";
import { httpsCallable } from "firebase/functions";
import {
  CorpEsiDataContext,
  PersonalESIDataContext,
} from "../../Context/EveDataContext";

export function FeedbackIcon() {
  const { users } = useContext(UsersContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const {
    esiIndJobs,
    esiOrders,
    esiHistOrders,
    esiSkills,
    esiJournal,
    esiTransactions,
    esiStandings,
    esiBlueprints,
  } = useContext(PersonalESIDataContext);
  const { corpEsiIndJobs } = useContext(CorpEsiDataContext);
  const [open, setOpen] = useState(false);
  const [inputText, updateInputText] = useState("");
  const [dataDump, updateDataDump] = useState(false);

  const parentUser = useMemo(() => {
    return users.find((i) => i.ParentUser);
  }, [users]);

  const handleSubmit = async () => {
    let userData = () => {
      let allAssets = () => {
        let assetArray = [];
        for (let user of users) {
          assetArray = assetArray.concat(
            JSON.parse(sessionStorage.getItem(`assets_${user.CharacterHash}`))
          );
        }
        return assetArray;
      };

      return {
        skills: esiSkills,
        jobs: esiIndJobs,
        orders: esiOrders,
        histOrders: esiHistOrders,
        blueprints: esiBlueprints,
        transactions: esiTransactions,
        journal: esiJournal,
        assets: allAssets(),
        standings: esiStandings,
        corpJobs: corpEsiIndJobs,
      };
    };

    const call = httpsCallable(
      functions,
      "submitUserFeedback-submitUserFeedback"
    );
    call({
      accountID: parentUser.accountID || null,
      response: inputText,
      esiData: dataDump ? JSON.stringify(userData()) : null,
    });

    updateDataDump((prev) => !prev);
    setOpen(false);
    setSnackbarData((prev) => ({
      ...prev,
      open: true,
      message: `Feedback Submitted`,
      severity: "success",
      autoHideDuration: 3000,
    }));
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
                sx={{
                  marginRight: { xs: "20px", sm: "60px" },
                  color: (theme) =>
                    theme.palette.mode === "dark"
                      ? theme.palette.primary.main
                      : theme.palette.secondary.main,
                }}
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
