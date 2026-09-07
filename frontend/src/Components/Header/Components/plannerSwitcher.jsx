import { useState } from "react";
import {
  Box,
  CircularProgress,
  FormControl,
  FormHelperText,
  MenuItem,
  Select,
} from "@mui/material";
import {
  plannerDisplayName,
  usePlannersQuery,
} from "../../../Hooks/React Query/planners.js";
import { ensurePlannerViaApi } from "../../../Functions/Endpoints/Private/planners.js";
import { sendActivePlanner } from "../../../Realtime/realtimeClient.js";

/**
 * Switches which planner this connection receives changes for.
 *
 * **It changes nothing else.** The app reads and writes one planner — the
 * account's own — and this does not move it: selecting another planner names it
 * on the server and points the realtime connection at it, so the backend can be
 * exercised end to end while the rest of the SPA stays as it is. Job data still
 * comes from the account's own planner until the SPA is taught otherwise.
 *
 * Selecting a planner does two things in order. Naming it gives it a document if
 * it has none, which is what turns a corporation the account is merely in into
 * one somebody has opened. Then the websocket is told, which replaces the planner
 * it was delivering rather than adding to it.
 */
export function PlannerSwitcher() {
  const { data: planners, isLoading, isError } = usePlannersQuery();
  const [active, setActive] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");

  if (isLoading) {
    return <CircularProgress size={20} aria-label="Loading planners" />;
  }
  if (isError || !planners?.length) {
    return null;
  }

  async function selectPlanner(owner) {
    setBusy(true);
    setFailure("");
    try {
      await ensurePlannerViaApi(owner);
      if (!sendActivePlanner(owner)) {
        setFailure("Not connected");
        return;
      }
      setActive(owner);
    } catch (err) {
      setFailure(err?.message ?? "Could not switch planner");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box sx={{ px: 2, py: 1 }}>
      <FormControl
        sx={{
          "& .MuiFormHelperText-root": {
            color: (theme) => theme.palette.secondary.main,
          },
        }}
        fullWidth
      >
        <Select
          id="planner-select"
          aria-describedby="planner-helper"
          variant="standard"
          size="small"
          value={active}
          disabled={busy}
          onChange={(event) => selectPlanner(event.target.value)}
        >
          {planners.map((planner) => (
            <MenuItem key={planner.owner} value={planner.owner}>
              {plannerDisplayName(planner)}
            </MenuItem>
          ))}
        </Select>
        <FormHelperText id="planner-helper" variant="standard" error={Boolean(failure)}>
          {failure || "Planner"}
        </FormHelperText>
      </FormControl>
    </Box>
  );
}
