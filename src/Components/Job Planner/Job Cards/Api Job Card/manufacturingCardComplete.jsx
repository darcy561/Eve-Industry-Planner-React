import {
  Avatar,
  Badge,
  Box,
  Grid,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import { useContext } from "react";
import { UsersContext } from "../../../../Context/AuthContext";

export function IndustryESICardComplete({ job }) {
  const {users} =useContext(UsersContext)
  
  const buildChar = users.find((i)=> i.CharacterID === job.installer_id)
  const blueprintData = buildChar.apiBlueprints.find((i) => i.item_id === job.blueprint_id)
  
  let blueprintType = "bp"
  if (blueprintData === undefined || blueprintData.quantity === -2) {
    blueprintType = "bpc"
  }

  return (
    <Tooltip title="Job imported from the Eve ESI">
      <Grid key={job.job_id} item xs={16} sm={6} md={4} lg={3}>
        <Paper elevation={3} square={true} sx={{ padding: "10px" }}>
          <Grid container item xs={12}>
            <Grid item xs={12}>
              <Typography
                variant="h6"
                align="center"
                sx={{ minHeight: "4rem", marginBottom: "5px" }}
              >
                {job.product_name}
              </Typography>
            </Grid>
            <Grid container item xs={12}>
              <Grid item xs={3} align="center">
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: "top", horizontal: "right" }}
                  badgeContent={
                    <Avatar
                      src={`https://images.evetech.net/characters/${job.installer_id}/portrait`}
                      variant="circular"
                      sx={{
                        height: "32px",
                        width: "32px",
                      }}
                    />
                  }
                >
                  <img
                    src={`https://images.evetech.net/types/${job.blueprint_type_id}/${blueprintType}?size=64`}
                    alt=""
                    style={{ margin: "auto", display: "block" }}
                  />
                </Badge>
              </Grid>
              <Grid container item xs={9}>
                <Grid container item xs={12}>
                  <Grid item xs={4}>
                    <Typography variant="body1">Runs:</Typography>
                  </Grid>
                  <Grid item xs={8} sx={{ paddingRight: "20px" }}>
                    <Typography variant="body2" align="right">
                      {job.runs}
                    </Typography>
                  </Grid>
                </Grid>
                <Grid container item xs={12} sx={{ marginTop: "10px" }}>
                  <Grid item xs={4}>
                    <Typography variant="body1">Status:</Typography>
                  </Grid>
                  <Grid item xs={8} sx={{ paddingRight: "20px" }}>
                    <Typography variant="body2" align="right">
                      Delivered
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
            <Grid
              item
              xs={12}
              sx={{
                height: "100%",
                backgroundColor: "rgba(204,204,204,0.5)",
                marginTop: "20px",
              }}
            >
              <Box sx={{ height: "100%" }}>
                <Typography align="center" variant="body2" color="black">
                  <b>ESI Manufacturing Job</b>
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Tooltip>
  );
}
