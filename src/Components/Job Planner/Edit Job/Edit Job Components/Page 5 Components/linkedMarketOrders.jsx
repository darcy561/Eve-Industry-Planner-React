import {
  Avatar,
  Box,
  Button,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import { useContext, useState } from "react";
import { IsLoggedInContext, UsersContext } from "../../../../../Context/AuthContext";
import { ActiveJobContext } from "../../../../../Context/JobContext";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import LinkOffIcon from "@mui/icons-material/LinkOff";

export function LinkedMarketOrders({ setJobModified, updateActiveOrder, updateShowAvailableOrders }) {
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const { users, updateUsers } = useContext(UsersContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  let linkedMarketOrders = [];
  let replacementBrokersFees = [];
  
  if (isLoggedIn) {
    activeJob.build.sale.marketOrders.forEach((order) => {
      const user = users.find((u) => u.CharacterID === order.user_id);

      const newOrderData = user.apiOrders.find(
        (newOrder) => newOrder.order_id === order.order_id
      );

      const completedOrderData = user.apiHistOrders.find(
        (histOrder) => histOrder.order_id === order.order_id
      );



      if (newOrderData !== undefined && !order.complete) {
        if (
          order.duration !== newOrderData.duration ||
          order.price !== newOrderData.price ||
          order.range !== newOrderData.range ||
          order.volume_remain !== newOrderData.volume_remain ||
          order.issued !== newOrderData.issued
        ) {
          order.duration = newOrderData.duration;
          order.price = newOrderData.price;
          order.range = newOrderData.range;
          order.volume_remain = newOrderData.volume_remain;
          order.issued = newOrderData.issued;
          order.timeStamps.push(newOrderData.issued);

          user.apiJournal.forEach((entry) => {
            if (
              entry.ref_type === "brokers_fee" &&
              Date.parse(newOrderData.issued) === Date.parse(entry.date)
            ) {
              entry.amount = Math.abs(entry.amount);
              entry.order_id = order.order_id;
              delete entry.balance;
              activeJob.build.sale.brokersFee.push(entry);
            }
          });
        }
      }
      if (newOrderData == undefined && !order.complete) {
        order.duration = completedOrderData.duration;
        order.price = completedOrderData.price;
        order.range = completedOrderData.range;
        order.volume_remain = completedOrderData.volume_remain;
        order.issued = completedOrderData.issued;
        order.complete = true;
      }

      linkedMarketOrders.push(order);
    });

    activeJob.build.sale.marketOrders.forEach((order) => {
      const user = users.find((u) => u.CharacterID === order.user_id);
      if (order.timeStamps.length !== activeJob.build.sale.brokersFee.length) {
        order.timeStamps.forEach((stamp) => {
          user.apiJournal.forEach((entry) => {
            if (
              entry.ref_type === "brokers_fee" &&
              Date.parse(stamp) === Date.parse(entry.date)
            ) {
              entry.amount = Math.abs(entry.amount);
              entry.order_id = order.order_id;
              delete entry.balance;
              replacementBrokersFees.push(entry);
            }
          });
        });
      }
    });
  }

  if (replacementBrokersFees.length !== 0) {
    activeJob.build.sale.brokersFee = replacementBrokersFees
  }

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
              Linked Orders
            </Typography>
          </Grid>
          <Grid
            item
            md={1}
            sx={{ display: { xs: "none", md: "block" } }}
            align="right"
          >
            <IconButton
              id="transaction_menu_button"
              onClick={handleMenuClick}
              aria-controls={Boolean(anchorEl) ? "transaction_menu" : undefined}
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
                "aria-labelledby": "transaction_menu_button",
              }}
            >
              <MenuItem onClick={() => updateShowAvailableOrders(true)}>
                View Other Market Orders
              </MenuItem>
            </Menu>
          </Grid>
        </Grid>
        {linkedMarketOrders.map((order) => {
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
                  {activeJob.build.sale.marketOrders.length > 1 && (
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => updateActiveOrder(order.order_id)}
                      sx={{ marginRight: "10px" }}
                    >
                      View Transactions
                    </Button>
                  )}
                  <Tooltip title="Unlink order from job" arrow>
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={() => {
                        const orderIndex =
                          activeJob.build.sale.marketOrders.findIndex(
                            (item) => order.order_id === item.order_id
                          );
                        const brokerFees =
                          activeJob.build.sale.brokersFee.filter(
                            (item) => item.order_id === order.order_id
                          );
                        let newOrderArray = activeJob.build.sale.marketOrders;
                        let newBrokerArray = activeJob.build.sale.brokersFee;
                        newOrderArray.splice(orderIndex, 1);

                        brokerFees.forEach((fee) => {
                          const index = newBrokerArray.findIndex(
                            (item) => item.id === fee.id
                          );
                          newBrokerArray.splice(index, 1);
                        });

                        const parentUserIndex = users.findIndex((i)=> i.ParentUser === true)
                        
                        const uIndex = users[parentUserIndex].linkedTrans.findIndex(
                          (trans) => trans === order.order_id
                        );

                        let newUsersArray = users

                        newUsersArray[parentUserIndex].linkedOrders.splice(uIndex, 1);
    
                        updateUsers(newUsersArray)



                        updateActiveJob((prev) => ({
                          ...prev,
                          build: {
                            ...prev.build,
                            sale: {
                              ...prev.build.sale,
                              marketOrders: newOrderArray,
                              brokersFee: newBrokerArray,
                            },
                          },
                        }));
                        setJobModified(true);
                      }}
                    >
                      <LinkOffIcon />
                    </IconButton>
                  </Tooltip>
                </Grid>
                {
                  (order.volume_remain === 0 && (
                    <Box
                      sx={{
                        backgroundColor: "manufacturing.main",
                        borderRadius: "5px",
                        marginLeft: "auto",
                        marginRight: "auto",
                        padding: "8px",
                      }}
                    >
                      <Typography variant="body1">Sold Out</Typography>
                    </Box>
                  ))
                }
              </Grid>
            </Grid>
          );
        })}
      </Grid>
    </Paper>
  );
}