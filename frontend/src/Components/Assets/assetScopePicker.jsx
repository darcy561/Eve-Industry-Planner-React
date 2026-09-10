import {
  Avatar,
  Box,
  FormControl,
  ListSubheader,
  MenuItem,
  Select,
} from "@mui/material";
import useUsersStore from "../../Zustand/usersStore";

/**
 * Whose assets a view is showing.
 *
 * @type {Readonly<Record<string, string>>}
 */
export const ASSET_OWNER = Object.freeze({
  CHARACTER: "character",
  CHARACTERS: "characters",
  CORPORATION: "corporation",
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
    <FormControl size="small" sx={{ minWidth: 220 }}>
      <Select
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        size="small"
      >
        <ListSubheader>Characters</ListSubheader>
        {includeEveryCharacter && (
          <MenuItem value={EVERY_CHARACTER}>Every character</MenuItem>
        )}
        {characters.map(({ CharacterHash, CharacterID, CharacterName }) => (
          <MenuItem
            key={CharacterHash}
            value={scopeValue({
              kind: ASSET_OWNER.CHARACTER,
              id: CharacterHash,
            })}
          >
            <OwnerLabel
              name={CharacterName}
              image={`https://images.evetech.net/characters/${CharacterID}/portrait?size=32`}
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
              image={`https://images.evetech.net/corporations/${corporation_id}/logo?size=32`}
            />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

function OwnerLabel({ name, image }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Avatar src={image} alt="" sx={{ height: 24, width: 24 }} />
      {name}
    </Box>
  );
}
