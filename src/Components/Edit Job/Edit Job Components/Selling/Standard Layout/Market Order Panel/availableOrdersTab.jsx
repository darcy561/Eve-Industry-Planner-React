import { useContext } from "react";
import { Avatar, Grid, IconButton, Tooltip, Typography } from "@mui/material";
import AddLinkIcon from "@mui/icons-material/AddLink";
import { getAnalytics, logEvent } from "firebase/analytics";
import { CorpEsiDataContext } from "../../../../../../Context/EveDataContext";
import {
  IsLoggedInContext,
  UsersContext,
} from "../../../../../../Context/AuthContext";
import { SnackBarDataContext } from "../../../../../../Context/LayoutContext";
import { useJobManagement } from "../../../../../../Hooks/useJobManagement";
import { useMarketOrderFunctions } from "../../../../../../Hooks/GeneralHooks/useMarketOrderFunctions";
import { useHelperFunction } from "../../../../../../Hooks/GeneralHooks/useHelperFunctions";

class ESIMarketOrder {
  constructor(order) {
    this.duration = order.duration;
    this.is_corporation = order.is_corporation;
    this.issued = order.issued;
    this.location_id = order.location_id;
    this.order_id = order.order_id;
    this.item_price = order.price;
    this.range = order.range;
    this.region_id = order.region_id;
    this.type_id = order.type_id;
    this.volume_remain = order.volume_remain;
    this.volume_total = order.volume_total;
    this.timeStamps = [order.issued];
    this.CharacterHash = order.CharacterHash;
    this.complete = order.complete || false;
  }
}

export function AvailableMarketOrdersTab({
  activeJob,
  updateActiveJob,
  setJobModified,
  updateShowAvailableOrders,
  itemOrderMatch,
  esiDataToLink,
  updateEsiDataToLink,
}) {
  const { users } = useContext(UsersContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { corpEsiData } = useContext(CorpEsiDataContext);
  const { calcBrokersFee } = useJobManagement();
  const { findBrokersFeeEntry } = useMarketOrderFunctions();
  const { findParentUserIndex, findUniverseItemObject } = useHelperFunction();
  const analytics = getAnalytics();

  return (
    <Grid container>
      <Grid
        container
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
        {itemOrderMatch.length !== 0 ? (
          itemOrderMatch.map((order) => {
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
                      <Typography variant="body2">
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
                        {order.price.toLocaleString(undefined, {
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
                    <Grid item xs={12} sx={{ marginTop: "5px" }}>
                      <Typography
                        sx={{ typography: { xs: "caption", sm: "body2" } }}
                      >
                        Last Modified:
                      </Typography>
                      <Typography
                        sx={{ typography: { xs: "caption", sm: "body2" } }}
                      >
                        {new Date(order.issued).toLocaleString()}
                      </Typography>
                    </Grid>
                  </Grid>
                  <Grid item xs={12} align="center">
                    <Tooltip
                      title="Link Order To Job."
                      arrow
                      placemnet="bottom"
                    >
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={async () => {
                          try {
                            const parentUserIndex = findParentUserIndex();
                            const brokersFee = await calcBrokersFee(order);
                            const brokersFeeObject = findBrokersFeeEntry(
                              order,
                              brokersFee
                            );

                            const newBrokersArray = brokersFeeObject
                              ? [brokersFeeObject]
                              : [];
                            const newMarketOrderArray = [
                              ...activeJob.build.sale.marketOrders,
                              { ...new ESIMarketOrder(order) },
                            ];

                            const newApiOrders = new Set(activeJob.apiOrders);
                            newApiOrders.add(order.order_id);

                            const newDataToLink = new Set(
                              esiDataToLink.marketOrders.add
                            );
                            const newDataToUnlink = new Set(
                              esiDataToLink.marketOrders.remove
                            );
                            newDataToLink.add(order.order_id);
                            newDataToUnlink.delete(order.order_id);

                            updateEsiDataToLink((prev) => ({
                              ...prev,
                              marketOrders: {
                                ...prev.marketOrders,
                                add: [...newDataToLink],
                                remove: [...newDataToUnlink],
                              },
                            }));
                            updateActiveJob((prev) => ({
                              ...prev,
                              apiOrders: newApiOrders,
                              build: {
                                ...prev.build,
                                sale: {
                                  ...prev.build.sale,
                                  marketOrders: newMarketOrderArray,
                                  brokersFee: newBrokersArray,
                                },
                              },
                            }));

                            setSnackbarData((prev) => ({
                              ...prev,
                              open: true,
                              message: "Linked",
                              severity: "success",
                              autoHideDuration: 1000,
                            }));

                            setJobModified(true);

                            logEvent(analytics, "linkedMarketOrder", {
                              UID: users[parentUserIndex].accountID,
                              isLoggedIn: isLoggedIn,
                            });
                          } catch (error) {
                            console.error(
                              "Failed to link market order:",
                              error
                            );
                            setSnackbarData((prev) => ({
                              ...prev,
                              open: true,
                              message: "Failed to link market order",
                              severity: "error",
                              autoHideDuration: 1000,
                            }));
                          }
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
            <Typography sx={{ typography: { xs: "body2", md: "body1" } }}>
              There are no orders appearing on the API matching this item type.
            </Typography>
          </Grid>
        )}
      </Grid>
    </Grid>
  );
}
