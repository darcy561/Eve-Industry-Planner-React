import { useMemo, useState } from "react";
import {
  Box,
  Chip,
  FormControlLabel,
  InputAdornment,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AppShellPanel from "../../Styled Components/Paper/AppShellPanel";
import useUsersStore from "../../Zustand/usersStore";
import AssetScopePicker, {
  ASSET_OWNER,
  readScopeValue,
  scopeValue,
} from "./assetScopePicker";
import AssetLibraryView, { ASSET_VIEWS } from "./assetLibraryView";

export default function AssetLibrary() {
  const mainCharacterHash = useUsersStore((state) =>
    state.account.actions.getMainCharacterHash()
  );
  const [scope, setScope] = useState(() =>
    scopeValue({ kind: ASSET_OWNER.CHARACTER, id: mainCharacterHash })
  );
  const [view, setView] = useState("held");
  const [search, setSearch] = useState("");
  const [hideAssembledShips, setHideAssembledShips] = useState(false);

  const { kind, id } = useMemo(() => readScopeValue(scope), [scope]);
  const views = ASSET_VIEWS[kind] ?? ASSET_VIEWS[ASSET_OWNER.CHARACTER];

  return (
    <AppShellPanel
      title="Assets"
      componentName="Asset Library"
      action={
        <AssetScopePicker
          value={scope}
          onChange={(next) => {
            setScope(next);
            setView("held");
          }}
        />
      }
    >
      <Stack spacing={2} sx={{ width: "100%" }}>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1,
          }}
        >
          {views.map(({ value, label }) => (
            <Chip
              key={value}
              label={label}
              color={view === value ? "primary" : "default"}
              variant={view === value ? "filled" : "outlined"}
              onClick={() => setView(value)}
            />
          ))}
          <FormControlLabel
            sx={{ marginLeft: "auto", marginRight: 0 }}
            label="Hide assembled ships"
            slotProps={{ typography: { variant: "body2" } }}
            control={
              <Switch
                size="small"
                checked={hideAssembledShips}
                onChange={(event) =>
                  setHideAssembledShips(event.target.checked)
                }
              />
            }
          />
        </Box>
        <TextField
          fullWidth
          size="small"
          value={search}
          placeholder="Filter by item or location"
          onChange={(event) => setSearch(event.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        <AssetLibraryView
          kind={kind}
          id={id}
          view={view}
          search={search}
          hideAssembledShips={hideAssembledShips}
        />
      </Stack>
    </AppShellPanel>
  );
}
