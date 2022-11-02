import {
  Avatar,
  Box,
  Grid,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import { useContext } from "react";
import { UsersContext } from "../../../../../Context/AuthContext";
import {
  ActiveJobContext,
  LinkedIDsContext,
} from "../../../../../Context/JobContext";
import { SnackBarDataContext } from "../../../../../Context/LayoutContext";
import { MdOutlineLinkOff } from "react-icons/md";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";
import { makeStyles } from "@mui/styles";
import { EveIDsContext } from "../../../../../Context/EveDataContext";

const useStyles = makeStyles((theme) => ({
  TextField: {
    "& .MuiFormHelperText-root": {
      color: theme.palette.secondary.main,
    },
    "& input::-webkit-clear-button, & input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
      {
        display: "none",
      },
  },
}));

class BrokerFee {
  constructor(entry, order, char) {
    this.order_id = order.order_id;
    this.id = entry.id;
    this.complete = false;
    this.date = entry.date;
    this.amount = Math.abs(entry.amount);
    this.CharacterHash = char.CharacterHash;
  }
}

export function LinkedMarketOrders({
  setJobModified,
  activeOrder,
  updateActiveOrder,
  updateShowAvailableOrders,
}) {
  const { eveIDs } = useContext(EveIDsContext);
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const { users } = useContext(UsersContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const {
    linkedOrderIDs,
    updateLinkedOrderIDs,
    linkedTransIDs,
    updateLinkedTransIDs,
  } = useContext(LinkedIDsContext);
  const classes = useStyles();

  let linkedMarketOrders = [];
  let replacementBrokersFees = [];

  activeJob.build.sale.marketOrders.forEach((order) => {
    const user = users.find((u) => u.CharacterHash === order.CharacterHash);

    if (user !== undefined) {
      const newOrderData = user.apiOrders.find(
        (newOrder) => newOrder.order_id === order.order_id
      );

      const completedOrderData = user.apiHistOrders.find(
        (histOrder) => histOrder.order_id === order.order_id
      );
      if (newOrderData !== undefined && !order.complete) {
        if (
          order.volume_remain !== newOrderData.volume_remain ||
          Date.parse(order.issued) !== Date.parse(newOrderData.issued)
        ) {
          order.duration = newOrderData.duration;
          order.item_price = newOrderData.price;
          order.range = newOrderData.range;
          order.volume_remain = newOrderData.volume_remain;
          if (Date.parse(order.issued) !== Date.parse(newOrderData.issued)) {
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
      }
      if (
        newOrderData === undefined &&
        !order.complete &&
        completedOrderData !== undefined
      ) {
        order.duration = completedOrderData.duration;
        order.item_price = completedOrderData.price;
        order.range = completedOrderData.range;
        order.volume_remain = completedOrderData.volume_remain;
        order.issued = completedOrderData.issued;
        order.complete = true;
      }
    }
    linkedMarketOrders.push(order);
  });

  activeJob.build.sale.marketOrders.forEach((order) => {
    const user = users.find((u) => u.CharacterHash === order.CharacterHash);
    if (order.timeStamps.length > activeJob.build.sale.brokersFee.length) {
      order.timeStamps.forEach((stamp) => {
        user.apiJournal.forEach((entry) => {
          if (
            entry.ref_type === "brokers_fee" &&
            Date.parse(stamp) === Date.parse(entry.date)
          ) {
            replacementBrokersFees.push(
              Object.assign({}, new BrokerFee(entry, order, user))
            );
          }
        });
      });
    }
  });

  if (replacementBrokersFees.length !== 0) {
    activeJob.build.sale.brokersFee = replacementBrokersFees;
  }

  return (
    <Grid container direction="row">
      <Grid
        container
        item
        xs={12}
        sx={{
          overflowY: "auto",
          maxHeight: {
            xs: "350px",
            sm: "260px",
            md: "240px",
            lg: "240px",
            xl: "480px",
          },
        }}
      >
        {linkedMarketOrders.map((order) => {
          const charData = users.find(
            (i) => i.CharacterHash === order.CharacterHash
          );
          const locationData = eveIDs.find((i) => i.id === order.location_id);

          return (
            <Grid
              key={order.order_id}
              container
              item
              xs={12}
              sm={6}
              sx={{ marginBottom: { xs: "20px", sm: "0px" } }}
            >
              <Grid container item>
                <Grid item xs={12} align="center">
                  <Avatar
                    src={
                      charData !== undefined
                        ? `https://images.evetech.net/characters/${charData.CharacterID}/portrait`
                        : ""
                    }
                    variant="circular"
                    sx={{
                      height: "32px",
                      width: "32px",
                    }}
                  />
                  <Grid item xs={12}>
                    <Typography
                      sx={{ typography: { xs: "caption", sm: "body2" } }}
                    >
                      {order.volume_remain.toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                      /
                      {order.volume_total.toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}{" "}
                      Items Remaining
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography
                      sx={{ typography: { xs: "caption", sm: "body2" } }}
                    >
                      {order.item_price.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      ISK Per Item
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography
                      sx={{ typography: { xs: "caption", sm: "body2" } }}
                    >
                      {locationData !== undefined
                        ? locationData.name
                        : "Location Data Unavailable"}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography
                      sx={{ typography: { xs: "caption", sm: "body2" } }}
                    >
                      Duration: {order.duration} Days
                    </Typography>
                  </Grid>
                  <Grid
                    item
                    xs={12}
                    sx={{ margin: "0px 5px", marginTop: "10px" }}
                  >
                    <>
                      {charData === undefined && (
                        <Box
                          sx={{
                            backgroundColor: "error.main",
                            color: "black",
                            marginLeft: "auto",
                            marginRight: "auto",
                            padding: "2px",
                          }}
                        >
                          <Typography variant="body1">
                            Unable To Update Order Information
                          </Typography>
                        </Box>
                      )}
                      {(charData !== undefined && order.volume_remain === 0) ||
                        (order.complete && (
                          <Box
                            className={classes.StatusBox}
                            sx={{
                              backgroundColor: "secondary.main",
                              color: "black",
                              marginLeft: "auto",
                              marginRight: "auto",
                              padding: "2px",
                            }}
                          >
                            <Typography
                              sx={{ typography: { xs: "body2", sm: "body1" } }}
                            >
                              Order Canceled
                            </Typography>
                          </Box>
                        ))}
                      {charData !== undefined &&
                        order.volume_remain === 0 &&
                        order.complete && (
                          <Box
                            className={classes.StatusBox}
                            sx={{
                              color: "black",
                              backgroundColor: "manufacturing.main",
                              marginLeft: "auto",
                              marginRight: "auto",
                              padding: "2px",
                            }}
                          >
                            <Typography
                              sx={{ typography: { xs: "body2", sm: "body1" } }}
                            >
                              Complete
                            </Typography>
                          </Box>
                        )}
                      {charData !== undefined &&
                        order.volume_remain > 0 &&
                        !order.complete && (
                          <Box
                            className={classes.StatusBox}
                            sx={{
                              color: "black",
                              backgroundColor: "primary.main",
                              marginLeft: "auto",
                              marginRight: "auto",
                              padding: "2px",
                            }}
                          >
                            <Typography
                              sx={{ typography: { xs: "body2", sm: "body1" } }}
                            >
                              Active
                            </Typography>
                          </Box>
                        )}
                    </>
                  </Grid>
                </Grid>
                <Grid item xs={12} align="center">
                  {linkedMarketOrders.length > 1 && (
                    <Tooltip
                      title="Filter Transactions By Location"
                      arrow
                      placement="bottom"
                    >
                      <IconButton
                        color="primary"
                        sx={{ marginRight: "20px" }}
                        onClick={() => {
                          let newActiveOrder = [...activeOrder];
                          if (
                            activeOrder.some((t) => t === order.location_id)
                          ) {
                            newActiveOrder = newActiveOrder.filter(
                              (i) => i != order.location_id
                            );
                          } else {
                            newActiveOrder.push(order.location_id);
                          }
                          updateActiveOrder(newActiveOrder);
                        }}
                      >
                        {activeOrder.some((t) => t === order.location_id) ? (
                          <FilterAltOffIcon />
                        ) : (
                          <FilterAltIcon />
                        )}
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip
                    title="Unlink Order From Job."
                    arrow
                    placemnet="bottom"
                  >
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => {
                        const orderIndex =
                          activeJob.build.sale.marketOrders.findIndex(
                            (item) => order.location_id === item.location_id
                          );
                        const parentUserIndex = users.findIndex(
                          (i) => i.ParentUser
                        );
                        let newOrderArray = [
                          ...activeJob.build.sale.marketOrders,
                        ];
                        let newBrokerArray = [
                          ...activeJob.build.sale.brokersFee,
                        ];
                        let newTransactionArray = [
                          ...activeJob.build.sale.transactions,
                        ];
                        let newApiOrders = new Set(activeJob.apiOrders);
                        let newApiTransactions = new Set(
                          activeJob.apiTransactions
                        );
                        let newLinkedTransIDs = new Set(linkedTransIDs);
                        let newLinkedOrderIDs = new Set(linkedOrderIDs);
                        let brokerFees = new Set();
                        let transactions = new Set();

                        activeJob.build.sale.brokersFee.forEach((item) => {
                          if (item.location_id === order.location_id) {
                            brokerFees.add(item.id);
                          }
                        });

                        activeJob.build.sale.transactions.forEach((trans) => {
                          if (trans.location_id === order.location_id) {
                            transactions.add(trans.transaction_id);
                            newLinkedTransIDs.delete(trans.transaction_id);
                            newApiTransactions.delete(trans.transaction_id);
                          }
                        });

                        if (orderIndex !== -1) {
                          newOrderArray.splice(orderIndex, 1);
                        }

                        newBrokerArray = newBrokerArray.filter((item) =>
                          brokerFees.has(item.id)
                        );

                        newLinkedOrderIDs.delete(order.order_id);

                        newTransactionArray = newTransactionArray.filter(
                          (item) => !transactions.has(item.transaction_id)
                        );
                        newApiOrders.delete(order.order_id);

                        updateLinkedOrderIDs([...newLinkedOrderIDs]);
                        updateLinkedTransIDs([...newLinkedTransIDs]);
                        updateActiveJob((prev) => ({
                          ...prev,
                          apiOrders: newApiOrders,
                          apiTransactions: newApiTransactions,
                          build: {
                            ...prev.build,
                            sale: {
                              ...prev.build.sale,
                              marketOrders: newOrderArray,
                              brokersFee: newBrokerArray,
                              transactions: newTransactionArray,
                            },
                          },
                        }));

                        setSnackbarData((prev) => ({
                          ...prev,
                          open: true,
                          message: "Unlinked",
                          severity: "error",
                          autoHideDuration: 1000,
                        }));

                        setJobModified(true);
                      }}
                    >
                      <MdOutlineLinkOff />
                    </IconButton>
                  </Tooltip>
                </Grid>
              </Grid>
            </Grid>
          );
        })}
      </Grid>
    </Grid>
  );
}
