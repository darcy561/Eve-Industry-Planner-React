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
import { useContext, useState } from "react";
import { functions } from "../../firebase";
import { UsersContext } from "../../Context/AuthContext";
import { httpsCallable } from "firebase/functions";
import {
  CorpEsiDataContext,
  PersonalESIDataContext,
} from "../../Context/EveDataContext";
import GLOBAL_CONFIG from "../../global-config-app";
import { useHelperFunction } from "../../Hooks/GeneralHooks/useHelperFunctions";

export function FeedbackIcon() {
  const { users } = useContext(UsersContext);
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
  const {
    corpEsiIndJobs,
    corpEsiOrders,
    corpEsiHistOrders,
    corpEsiBlueprints,
    corpEsiJournal,
    corpEsiTransactions,
    corpEsiData,
  } = useContext(CorpEsiDataContext);
  const [open, setOpen] = useState(false);
  const [inputText, updateInputText] = useState("");
  const [dataDump, updateDataDump] = useState(false);
  const { findParentUser, sendSnackbarNotificationSuccess } =
    useHelperFunction();

  const parentUser = findParentUser();

  const { PRIMARY_THEME } = GLOBAL_CONFIG;

  async function handleSubmit() {
    function buildSubmissionData() {
      return {
        users: buildUserObject(),
        corporations: buildCorporationObject(),
      };
    }

    function buildUserObject() {
      let usersObject = {};

      users.forEach((user) => {
        usersObject[user.CharacterHash] = {
          skills: esiSkills.find((i) => i.user === user.CharacterHash)?.data,
          industryJobs: esiIndJobs.find((i) => i.user === user.CharacterHash)
            ?.data,
          marketOrders: esiOrders.find((i) => i.user === user.CharacterHash)
            ?.data,
          historicMarketOrders: esiHistOrders.find(
            (i) => i.user === user.CharacterHash
          )?.data,
          blueprints: esiBlueprints.find((i) => i.user === user.CharacterHash)
            ?.data,
          transactions: esiTransactions.find(
            (i) => i.user === user.CharacterHash
          )?.data,
          journal: esiJournal.find((i) => i.user === user.CharacterHash)?.data,
          standings: esiStandings.find((i) => i.user === user.CharacterHash)
            ?.data,
          assets: JSON.parse(
            sessionStorage.getItem(`assets_${user.CharacterHash}`)
          ),
        };
      });

      return usersObject;
    }
    function buildCorporationObject() {
      let corporationObject = {};
      corpEsiData.forEach((value, key) => {
        corporationObject[key] = {
          corporationObject: value,
          industryJobs: corpEsiIndJobs.get(key),
          marketOrders: corpEsiOrders.get(key),
          historicMarketOrders: corpEsiHistOrders.get(key),
          blueprints: corpEsiBlueprints.get(key),
          transactions: null,
          journal: null,
          assets: JSON.parse(sessionStorage.getItem(`corpAssets_${key}`)),
        };
      });
      return corporationObject;
    }

    const call = httpsCallable(
      functions,
      "submitUserFeedback-submitUserFeedback"
    );

    call({
      accountID: parentUser.accountID || null,
      response: inputText,
      esiData: dataDump ? buildSubmissionData() : null,
    });

    updateDataDump((prev) => !prev);
    setOpen(false);
    sendSnackbarNotificationSuccess("Feedback Submitted");
  }

  return (
    <>
      <Fab
        color="primary"
        size="small"
        variant="extended"
        sx={{
          position: "fixed",
          bottom: "10px ",
          right: "5px",
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
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
                    theme.palette.mode === PRIMARY_THEME
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
