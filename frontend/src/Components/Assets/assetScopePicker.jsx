import { Box, ListSubheader, MenuItem } from "@mui/material";
import useUsersStore from "../../Zustand/usersStore";
import { OWNER_KIND } from "../../Functions/Shared/ownerKind";
import AppShellSelect from "../../Styled Components/Select/AppShellSelect";
import OwnerAvatar from "../../Styled Components/Avatar/OwnerAvatar";

/**
 * Whose assets a view is showing.
 *
 * The two owner kinds are the shared ones rather than a second spelling of them, because a picker
 * value is read back into an owner reference. `CHARACTERS` is this control's own: every tracked
 * character at once is a question, not an owner.
 *
 * @type {Readonly<Record<string, string>>}
 */
export const ASSET_OWNER = Object.freeze({
  CHARACTER: OWNER_KIND.CHARACTER,
  CHARACTERS: "characters",
  CORPORATION: OWNER_KIND.CORPORATION,
});

/** The one entry that names no owner: every tracked character at once. */
export const EVERY_CHARACTER = `${ASSET_OWNER.CHARACTERS}:all`;

/** A scope as one value, so a single control can offer both kinds. */
export const scopeValue = ({ kind, id }) => `${kind}:${id}`;

/**
 * Reads a picker value back into the scope it names.
 *
 * @param {string} value
 * @returns {{kind: string, id: string}}
 */
export function readScopeValue(value) {
  const separator = value.indexOf(":");
  return {
    kind: value.slice(0, separator),
    id: value.slice(separator + 1),
  };
}

/**
 * Picks whose assets to look at: any tracked character, or any corporation they are in.
 *
 * One control rather than a tab bar and a select, because which kind of owner it is matters only
 * for what the views are called.
 *
 * `includeEveryCharacter` adds the account-wide entry, which suits a question about where one thing
 * is but not a library page, where a tree of every character's holdings is not a view of anything.
 *
 * @param {{value: string, onChange: (value: string) => void, includeEveryCharacter?: boolean}} props
 */
export default function AssetScopePicker({
  value,
  onChange,
  includeEveryCharacter = false,
}) {
  const characters = useUsersStore((state) => state.account.characters);
  const corporations = useUsersStore((state) => state.account.corporations);

  return (
    <AppShellSelect value={value ?? ""} onChange={onChange} minWidth={220}>
      <ListSubheader>Characters</ListSubheader>
      {includeEveryCharacter && (
        <MenuItem value={EVERY_CHARACTER}>Every character</MenuItem>
      )}
      {characters.map(({ CharacterHash, CharacterName }) => (
        <MenuItem
          key={CharacterHash}
          value={scopeValue({
            kind: ASSET_OWNER.CHARACTER,
            id: CharacterHash,
          })}
        >
          <OwnerLabel
            name={CharacterName}
            owner={{ kind: ASSET_OWNER.CHARACTER, id: CharacterHash }}
          />
        </MenuItem>
      ))}

      <ListSubheader>Corporations</ListSubheader>
      {corporations.map(({ corporation_id, corporationName }) => (
        <MenuItem
          key={corporation_id}
          value={scopeValue({
            kind: ASSET_OWNER.CORPORATION,
            id: corporation_id,
          })}
        >
          <OwnerLabel
            name={corporationName}
            owner={{ kind: ASSET_OWNER.CORPORATION, id: corporation_id }}
          />
        </MenuItem>
      ))}
    </AppShellSelect>
  );
}

function OwnerLabel({ name, owner }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <OwnerAvatar owner={owner} size={24} />
      {name}
    </Box>
  );
}
