import {
  Avatar,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import { useContext, useState } from "react";
import { ActiveJobContext } from "../../../../../Context/JobContext";
import { UsersContext } from "../../../../../Context/AuthContext";
import AddLinkIcon from "@mui/icons-material/AddLink";
import MoreVertIcon from "@mui/icons-material/MoreVert";

export function AvailableMarketOrders({ setJobModified, itemOrderMatch, updateShowAvailableOrders }) {
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const { users } = useContext(UsersContext);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  return (
    <Paper
      sx={{
        padding: "20px",
      }}
      elevation={3}
      square={true}
    >
      <Grid container direction="row">
        <Grid container item xs={12} sx={{ marginBottom: "20px" }}>
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
            <IconButton
              id="marketOrder_menu_button"
              onClick={handleMenuClick}
              aria-controls={Boolean(anchorEl) ? "marketOrder_menu" : undefined}
              aria-haspopup="true"
              aria-expanded={Boolean(anchorEl) ? "true" : undefined}
            >
              <MoreVertIcon size="small" color="Secondary" />
            </IconButton>
            <Menu
              id="transaction_menu"
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              MenuListProps={{
                "aria-labelledby": "marketOrder_menu_button",
              }}
            >
              <MenuItem onClick={() => updateShowAvailableOrders(false)}>
                View Linked Market Orders
              </MenuItem>
            </Menu>
          </Grid>
        </Grid>
        {itemOrderMatch.length !== 0 ? (
          itemOrderMatch.map((order) => {
            return (
              <Grid key={order.order_id} container>
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
                </Grid>
                <Grid container item>
                  <Grid item xs={4}>
                    <Typography variant="body1">{order.price.toLocaleString()} ISK</Typography>
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
                    <Typography variant="body2">
                      {order.location_name}
                    </Typography>
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
                    <Typography variant="body2">
                      {order.duration} Days
                    </Typography>
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
                    <Typography variant="body2">Last Updated:</Typography>
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
                          const ParentUserIndex = users.findIndex((i)=> i.ParentUser === true)
                          const char = users.find(
                            (user) => user.CharacterID === order.user_id
                          );
                          console.log(char);
                          let newBrokersArray = [];
                          char.apiJournal.forEach((entry) => {
                            if (
                              entry.ref_type === "brokers_fee" &&
                              Date.parse(order.issued) ===
                                Date.parse(entry.date)
                            ) {
                              entry.amount = Math.abs(entry.amount);
                              entry.order_id = order.order_id;
                              entry.complete = false;
                              delete entry.balance;
                              newBrokersArray.push(entry);
                            }
                          });
                          let newMarketOrderArray =
                            activeJob.build.sale.marketOrders;
                          newMarketOrderArray.push(order);
                          users[ParentUserIndex].linkedOrders.push(order.order_id);

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
          })
        ) : (
          <Grid item xs={12} align="center">
            <Typography variant="body1">
              There are no orders appearing on the API matching this item type.
            </Typography>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
}
