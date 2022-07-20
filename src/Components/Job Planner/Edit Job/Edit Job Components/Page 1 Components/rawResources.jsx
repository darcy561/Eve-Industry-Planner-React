import {
  Box,
  Container,
  Divider,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Typography,
} from "@mui/material";
import { useContext, useState } from "react";
import { ActiveJobContext } from "../../../../../Context/JobContext";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CopyToClipboard from "react-copy-to-clipboard";
import { SnackBarDataContext } from "../../../../../Context/LayoutContext";
import { MaterialRow } from "./materialRow";
import { useJobManagement } from "../../../../../Hooks/useJobManagement";

export function RawResourceList() {
  const { activeJob } = useContext(ActiveJobContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { massBuildMaterials } = useJobManagement();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  let copyText = "";
  let volumeTotal = 0;

  activeJob.build.materials.forEach((i) => {
    copyText = copyText.concat(`${i.name} ${i.quantity}\n`);
    volumeTotal += i.volume * i.quantity;
  });

  return (
    <Paper
      sx={{
        minWidth: "100%",
        paddingBottom: "20px",
        paddingTop: "20px",
        position: "relative",
      }}
      elevation={3}
      square={true}
    >
      <Container disableGutters={true}>
        <Box sx={{ marginBottom: "20px" }}>
          <Grid container direction="row">
            <Grid item xs={12}>
              <Typography variant="h6" color="primary" align="center">
                Raw Resources
              </Typography>
            </Grid>
            <IconButton
              id="rawResources_menu_button"
              onClick={handleMenuClick}
              aria-controls={
                Boolean(anchorEl) ? "rawResources_menu" : undefined
              }
              aria-haspopup="true"
              aria-expanded={Boolean(anchorEl) ? "true" : undefined}
              sx={{ position: "absolute", top: "10px", right: "10px" }}
            >
              <MoreVertIcon size="small" color="primary" />
            </IconButton>
            <Menu
              id="rawResources_menu"
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              MenuListProps={{
                "aria-labelledby": "rawResources_menu_button",
              }}
            >
              <CopyToClipboard
                text={copyText}
                onCopy={() => {
                  handleMenuClose();
                  setSnackbarData((prev) => ({
                    ...prev,
                    open: true,
                    message: `Resource List Copied`,
                    severity: "success",
                    autoHideDuration: 1000,
                  }));
                }}
              >
                <MenuItem>Copy Resources List</MenuItem>
              </CopyToClipboard>
              <MenuItem
                onClick={() => {
                  handleMenuClose();
                  massBuildMaterials([activeJob]);
                }}
              >
                Create All Child Jobs
              </MenuItem>
            </Menu>
          </Grid>
        </Box>
        <Box
          sx={{
            marginLeft: { xs: "5px", md: "15px" },
            marginRight: { xs: "10px", md: "20px" },
          }}
        >
          <Grid container item direction="column">
            {activeJob.build.materials.map((material) => {
              return <MaterialRow key={material.typeID} material={material} />;
            })}
          </Grid>
        </Box>
        <Grid container sx={{ marginTop: "20px" }}>
          <Grid item xs={6} sm={8} md={9}>
            <Typography
              sx={{ typography: { xs: "caption", sm: "body2" } }}
              align="right"
            >
              Total Volume
            </Typography>
          </Grid>
          <Grid item xs={6} sm={4} md={3}>
            <Typography
              sx={{ typography: { xs: "caption", sm: "body2" } }}
              align="center"
            >
              {volumeTotal.toLocaleString()} m3
            </Typography>
          </Grid>
        </Grid>
      </Container>
    </Paper>
  );
}
