import { useContext } from "react";
import { Avatar, Grid, IconButton, Tooltip, Typography } from "@mui/material";
import AddLinkIcon from "@mui/icons-material/AddLink";
import { getAnalytics, logEvent } from "firebase/analytics";
import { CorpEsiDataContext } from "../../../../../../Context/EveDataContext";
import {
  IsLoggedInContext,
  UsersContext,
} from "../../../../../../Context/AuthContext";
import { useJobManagement } from "../../../../../../Hooks/useJobManagement";
import { useMarketOrderFunctions } from "../../../../../../Hooks/GeneralHooks/useMarketOrderFunctions";
import { useHelperFunction } from "../../../../../../Hooks/GeneralHooks/useHelperFunctions";
import {
  LARGE_TEXT_FORMAT,
  STANDARD_TEXT_FORMAT,
  TWO_DECIMAL_PLACES,
  ZERO_DECIMAL_PLACES,
} from "../../../../../../Context/defaultValues";
import Job from "../../../../../../Classes/jobConstructor";

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
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const { corpEsiData } = useContext(CorpEsiDataContext);
  const { calcBrokersFee } = useJobManagement();
  const { findBrokersFeeEntry } = useMarketOrderFunctions();
  const {
    findParentUserIndex,
    findUniverseItemObject,
    sendSnackbarNotificationSuccess,
    sendSnackbarNotificationError,
  } = useHelperFunction();
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
            const locationName =
              findUniverseItemObject(order.location_id)?.name ||
              "Location Data Unavailable";

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
                            ? corpData
                              ? `https://images.evetech.net/corporations/${corpData.corporation_id}/logo`
                              : ""
                            : charData
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
                        {order.volume_remain.toLocaleString(
                          undefined,
                          ZERO_DECIMAL_PLACES
                        )}
                        /
                        {order.volume_total.toLocaleString(
                          undefined,
                          ZERO_DECIMAL_PLACES
                        )}{" "}
                        Items Remaining
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography sx={{ typography: STANDARD_TEXT_FORMAT }}>
                        {order.price.toLocaleString(
                          undefined,
                          TWO_DECIMAL_PLACES
                        )}{" "}
                        ISK Per Item
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography sx={{ typography: STANDARD_TEXT_FORMAT }}>
                        {locationName}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography sx={{ typography: STANDARD_TEXT_FORMAT }}>
                        Duration: {order.duration} Days
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sx={{ marginTop: "5px" }}>
                      <Typography sx={{ typography: STANDARD_TEXT_FORMAT }}>
                        Last Modified:
                      </Typography>
                      <Typography sx={{ typography: STANDARD_TEXT_FORMAT }}>
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
                            activeJob.apiOrders = newApiOrders;
                            activeJob.build.sale.marketOrders =
                              newMarketOrderArray;
                            activeJob.build.sale.brokersFee = newBrokersArray;
                            updateActiveJob((prev) => new Job(prev));
                            sendSnackbarNotificationSuccess("Linked");

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
                            sendSnackbarNotificationError(
                              "Failed to link market order"
                            );
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
            <Typography sx={{ typography: LARGE_TEXT_FORMAT }}>
              There are no orders appearing on the API matching this item type.
            </Typography>
          </Grid>
        )}
      </Grid>
    </Grid>
  );
}
