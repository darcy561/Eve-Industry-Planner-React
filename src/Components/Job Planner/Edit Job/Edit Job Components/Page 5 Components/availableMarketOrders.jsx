import {
  Avatar,
  Divider,
  Grid,
  IconButton,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useContext } from "react";
import { ActiveJobContext } from "../../../../../Context/JobContext";
import { UsersContext } from "../../../../../Context/AuthContext";
import { EveIDsContext } from "../../../../../Context/EveDataContext";
import AddLinkIcon from "@mui/icons-material/AddLink";
import MoreVertIcon from "@mui/icons-material/MoreVert";

export function AvailableMarketOrders({ setJobModified }) {
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const { users } = useContext(UsersContext);
  const { eveIDs } = useContext(EveIDsContext);

  let itemOrderMatch = [];

  users.forEach((user) => {
    user.apiOrders.forEach((order) => {
      if (order.type_id === activeJob.itemID && !activeJob.build.sale.marketOrders.includes(order.order_id)) {
        eveIDs.find((item) => {
          if (item.id === order.location_id) {
            order.user_id = user.CharacterID;
            order.location_name = item.name;
          }
          if (item.id === order.region_id) {
            order.region_name = item.name;
          }
        });
        itemOrderMatch.push(order);
      }
    });
  });
  console.log(itemOrderMatch);

  return (
    <Paper
      sx={{
        padding: "20px",
      }}
      elevation={3}
      square={true}
    >
      <Grid container direction="row">
        <Grid container item xs={12} sx={{marginBottom: "20px"}}>
        <Grid item xs={12} md={11}>
          <Typography variant="h5" color="primary" align="center">
            Available Orders
          </Typography>
        </Grid>
        <Grid
          item
          md={1}
          sx={{ display: { xs: "none", md: "block" } }}
          align="right"
        >
          <IconButton>
            <MoreVertIcon size="small" color="Secondary" />
          </IconButton>
          </Grid>
          </Grid>
        {itemOrderMatch.map((order) => {
          return (
            <Grid container>
              <Grid container item sx={{ marginBottom: "10px" }}>
                <Grid item xs={4}>
                  <Avatar
                    src={`https://images.evetech.net/characters/${order.user_id}/portrait`}
                    variant="circular"
                    sx={{
                      height: "32px",
                      width: "32px",
                    }}
                  />
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body1">
                    {order.volume_remain} / {order.volume_total} Items
                  </Typography>
                </Grid>
              </Grid>
              <Grid container item sx={{ marginBottom: "10px" }}>
                <Grid
                  item
                  xs={12}
                  md={3}
                  sx={{
                    marginBottom: {
                      xs: "10px",
                      md: "0px",
                    },
                  }}
                >
                  <Typography variant="body2">Location:</Typography>
                </Grid>
                <Grid item xs={8} md={5}>
                  <Typography variant="body2">{order.location_name}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2">{order.region_name}</Typography>
                </Grid>
              </Grid>
              <Grid container item xs={12} sx={{ marginBottom: "10px" }}>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2">Duration:</Typography>
                </Grid>
                <Grid
                  item
                  xs={6}
                  md={3}
                  sx={{
                    marginBottom: {
                      xs: "10px",
                      md: "0px",
                    },
                  }}
                >
                  <Typography variant="body2">{order.duration} Days</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2">Range:</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2">{order.range}</Typography>
                </Grid>
              </Grid>
              <Grid container item xs={12}>
                <Grid item xs={3}>
                  <Typography variant="body2">Created:</Typography>
                </Grid>
                <Grid item xs={9}>
                  <Typography variant="body2">
                    {new Date(order.issued).toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
              <Grid container item xs={12}>
                <Grid item xs={12} align="right">
                  <Tooltip title="Link order to job" arrow>
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={() => {
                        const char = users.find(
                          (user) => user.CharacterID === order.user_id
                        );
                        let newBrokersArray = [];
                        char.apiJournal.forEach((entry) => {
                          if (
                            entry.ref_type === "brokers_fee" &&
                            Date.parse(order.issued) === Date.parse(entry.date)
                          ) {
                            entry.amount = Math.abs(entry.amount);
                            delete entry.balance;
                            newBrokersArray.push(entry);
                          }
                        });
                        let newMarketOrderArray =
                          activeJob.build.sale.marketOrders;
                        newMarketOrderArray.push(order.order_id);
                        updateActiveJob((prev) => ({
                          ...prev,
                          build: {
                            ...prev.build,
                            sale: {
                              ...prev.build.sale,
                              marketOrders: newMarketOrderArray,
                              brokersFee: newBrokersArray,
                            },
                          },
                        }));
                        setJobModified(true);
                      }}
                    >
                      <AddLinkIcon />
                    </IconButton>
                  </Tooltip>
                </Grid>
              </Grid>
            </Grid>
          );
        })}
      </Grid>
    </Paper>
  );
}
