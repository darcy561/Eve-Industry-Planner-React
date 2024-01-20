import { useContext } from "react";
import { MenuItem, Select } from "@mui/material";
import { UsersContext } from "../../../Context/AuthContext";

export function CharacterSelectDropdown({
  selectedCharacter,
  updateSelectedCharacter,
}) {
  const { users } = useContext(UsersContext);

  function onSelectChange(event) {
    updateSelectedCharacter(event.target.value);
  }

  return (
    <Select
      variant="standard"
      size="small"
      value={selectedCharacter}
      onChange={onSelectChange}
    >
      {users.map(({ CharacterHash, CharacterName }) => {
        return (
          <MenuItem key={CharacterHash} value={CharacterHash}>
            {CharacterName}
          </MenuItem>
        );
      })}
    </Select>
  );
}
