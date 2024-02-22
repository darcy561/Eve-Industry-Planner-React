import { useContext, useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Grid,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import { MdOutlineLinkOff } from "react-icons/md";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";
import {
  CorpEsiDataContext,
  PersonalESIDataContext,
} from "../../../../../../Context/EveDataContext";
import { UsersContext } from "../../../../../../Context/AuthContext";
import { SnackBarDataContext } from "../../../../../../Context/LayoutContext";
import { useHelperFunction } from "../../../../../../Hooks/GeneralHooks/useHelperFunctions";

export function LinkedMarketOrdersTab({
  activeJob,
  updateActiveJob,
  setJobModified,
  activeOrder,
  updateActiveOrder,
  updateShowAvailableOrders,
  esiDataToLink,
  updateEsiDataToLink,
}) {
  const { users } = useContext(UsersContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { esiOrders, esiHistOrders } = useContext(PersonalESIDataContext);
  const { corpEsiData } = useContext(CorpEsiDataContext);
  const [linkedMarketOrders, updateLinkedMarketOrders] = useState([]);
  const { findUniverseItemObject } = useHelperFunction();

  useEffect(() => {
    const newLinkedMarketOrders = activeJob.build.sale.marketOrders.map(
      (order) => {
        console.log(order)
        const userOrders =
          esiOrders.find((i) => i.user === order.CharacterHash)?.data || [];
        const userHistOrders =
          esiHistOrders.find((i) => i.user === order.CharacterHash)?.data || [];

        if (!userOrders.length && !userHistOrders.length) return order;

        const newOrderData = userOrders.find(
          (newOrder) => newOrder.order_id === order.order_id
        );
        const completedOrderData = userHistOrders.find(
          (histOrder) => histOrder.order_id === order.order_id
        );

        let newOrder = { ...order };

        if (newOrderData && !order.complete) {
          if (
            order.volume_remain !== newOrderData.volume_remain ||
            Date.parse(order.issued) !== Date.parse(newOrderData.issued)
          ) {
            newOrder = {
              ...order,
              duration: newOrderData.duration,
              item_price: newOrderData.price,
              range: newOrderData.range,
              volume_remain: newOrderData.volume_remain,
              timeStamps: [...order.timeStamps],
            };
          }
        }
        if (!newOrderData && !order.complete && completedOrderData) {
          newOrder = {
            ...order,
            duration: completedOrderData.duration,
            item_price: completedOrderData.price,
            range: completedOrderData.range,
            volume_remain: completedOrderData.volume_remain,
            issued: completedOrderData.issued,
            complete: true,
          };
        }

        return newOrder;
      }
    );
    activeJob.build.sale.marketOrders = newLinkedMarketOrders;
    updateLinkedMarketOrders(newLinkedMarketOrders);
  }, [activeJob, esiOrders, esiHistOrders]);

  return (
    <Grid container>
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
        {linkedMarketOrders?.map((order) => {
          const charData = users.find(
            (i) => i.CharacterHash === order.CharacterHash
          );
          const locationData = findUniverseItemObject(order.location_id);
          const corpData = corpEsiData.get(charData?.corporation_id);
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
                <Grid
                  container
                  item
                  xs={12}
                  align="center"
                  justifyContent="center"
                >
                  <Tooltip
                    title={
                      order.is_corporation
                        ? corpData.name
                        : charData.CharacterName
                    }
                    arrow
                    placement="right"
                  >
                    <Avatar
                      src={
                        order.is_corporation
                          ? corpData !== undefined
                            ? `https://images.evetech.net/corporations/${corpData.corporation_id}/logo`
                            : ""
                          : charData !== undefined
                          ? `https://images.evetech.net/characters/${charData.CharacterID}/portrait`
                          : ""
                      }
                      variant="circular"
                      sx={{
                        height: "32px",
                        width: "32px",
                      }}
                    />
                  </Tooltip>
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
                            sx={{
                              backgroundColor: "secondary.main",
                              color: "black",
                              marginLeft: "auto",
                              marginRight: "auto",
                              padding: "2px",
                              "& .MuiFormHelperText-root": {
                                color: (theme) => theme.palette.secondary.main,
                              },
                              "& input::-webkit-clear-button, & input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
                                {
                                  display: "none",
                                },
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
                            sx={{
                              color: "black",
                              backgroundColor: "manufacturing.main",
                              marginLeft: "auto",
                              marginRight: "auto",
                              padding: "2px",
                              "& .MuiFormHelperText-root": {
                                color: (theme) => theme.palette.secondary.main,
                              },
                              "& input::-webkit-clear-button, & input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
                                {
                                  display: "none",
                                },
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
                            sx={{
                              color: "black",
                              backgroundColor: "primary.main",
                              marginLeft: "auto",
                              marginRight: "auto",
                              padding: "2px",
                              "& .MuiFormHelperText-root": {
                                color: (theme) => theme.palette.secondary.main,
                              },
                              "& input::-webkit-clear-button, & input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
                                {
                                  display: "none",
                                },
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

                        const newMarketOrdersToLink = new Set(
                          esiDataToLink.marketOrders.add
                        );
                        const newMarketOrdersToUnlink = new Set(
                          esiDataToLink.marketOrders.remove
                        );
                        const newTransactionsToLink = new Set(
                          esiDataToLink.transactions.add
                        );
                        const newTransactionsToUnlink = new Set(
                          esiDataToLink.transactions.remove
                        );
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

                            newTransactionsToLink.delete(trans.transaction_id);
                            newTransactionsToUnlink.add(trans.transaction_id);
                            newApiTransactions.delete(trans.transaction_id);
                          }
                        });

                        if (orderIndex !== -1) {
                          newOrderArray.splice(orderIndex, 1);
                        }

                        newBrokerArray = newBrokerArray.filter((item) =>
                          brokerFees.has(item.id)
                        );

                        newMarketOrdersToUnlink.add(order.order_id);
                        newMarketOrdersToLink.delete(order.order_id);

                        newTransactionArray = newTransactionArray.filter(
                          (item) => !transactions.has(item.transaction_id)
                        );
                        newApiOrders.delete(order.order_id);

                        updateEsiDataToLink((prev) => ({
                          ...prev,
                          marketOrders: {
                            ...prev.marketOrders,
                            add: [...newMarketOrdersToLink],
                            remove: [...newMarketOrdersToUnlink],
                          },
                          transactions: {
                            ...prev.transactions,
                            add: [...newTransactionsToLink],
                            remove: [...newTransactionsToUnlink],
                          },
                        }));
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
