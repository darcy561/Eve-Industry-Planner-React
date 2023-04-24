import { Avatar, Box, Grid, Menu, MenuItem, Tooltip } from "@mui/material";
import { useContext, useMemo, useState } from "react";
import { UsersContext } from "../../../Context/AuthContext";
import { useNavigate } from "react-router";
import { useAccountManagement } from "../../../Hooks/useAccountManagement";
import { UserLoginUIContext } from "../../../Context/LayoutContext";

export function UserIcon() {
  const { users } = useContext(UsersContext);
  const { loginInProgressComplete } = useContext(UserLoginUIContext);
  const [anchor, setAnchor] = useState(null);

  const { logUserOut } = useAccountManagement();
  const navigate = useNavigate();

  const parentUser = useMemo(() => users.find((i) => i.ParentUser), [users]);

  const openMenu = (event) => {
    setAnchor(event.currentTarget);
  };
  const closeMenu = () => {
    setAnchor(null);
  };

  if (!loginInProgressComplete) {
    return null;
  }
  return (
    <>
      <Box>
        <Grid container direction="column">
          <Grid item align="center">
            <Tooltip title="Account" arrow>
              <Avatar
                alt="Account Logo"
                src={`https://images.evetech.net/characters/${parentUser.CharacterID}/portrait`}
                onClick={openMenu}
                sx={{
                  height: { xs: "36px", sm: "48px" },
                  width: { xs: "36px", sm: "48px" },
                  marginRight: { sm: "20px" },
                }}
              />
            </Tooltip>
          </Grid>
        </Grid>
      </Box>

      <Menu
        id="userMenu"
        anchorEl={anchor}
        keepMounted
        open={Boolean(anchor)}
        onClose={closeMenu}
        onClick={closeMenu}
      >
        <MenuItem
          onClick={() => {
            navigate("/accounts");
          }}
        >
          Accounts
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigate("/settings");
          }}
        >
          Settings
        </MenuItem>
        <MenuItem onClick={logUserOut}>Log Out</MenuItem>
      </Menu>
    </>
  );
}
