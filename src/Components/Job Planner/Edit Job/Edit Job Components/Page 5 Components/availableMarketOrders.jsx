import { Avatar, Grid, IconButton, Tooltip, Typography } from "@mui/material";
import { useContext } from "react";
import { ActiveJobContext } from "../../../../../Context/JobContext";
import {
  IsLoggedInContext,
  UsersContext,
} from "../../../../../Context/AuthContext";
import AddLinkIcon from "@mui/icons-material/AddLink";
import { SnackBarDataContext } from "../../../../../Context/LayoutContext";
import { getAnalytics, logEvent } from "firebase/analytics";
import { EveIDsContext } from "../../../../../Context/EveDataContext";

class ESIBrokerFee {
  constructor(entry, order, char) {
    this.order_id = order.order_id;
    this.id = entry.id;
    this.complete = false;
    this.date = entry.date;
    this.amount = Math.abs(entry.amount);
    this.CharacterHash = char.CharacterHash;
  }
}

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

export function AvailableMarketOrders({
  setJobModified,
  itemOrderMatch,
  updateShowAvailableOrders,
}) {
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const { eveIDs } = useContext(EveIDsContext);
  const { users, updateUsers } = useContext(UsersContext);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const analytics = getAnalytics();

  return (
    <Grid container direction="row">
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
                        {locationData !== undefined ? locationData.name : "Location Data Unavailable"}
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
                        onClick={() => {
                          const ParentUserIndex = users.findIndex(
                            (i) => i.ParentUser === true
                          );
                          const char = users.find(
                            (user) => user.CharacterHash === order.CharacterHash
                          );
                          let newBrokersArray = [];
                          if (char !== undefined) {
                            char.apiJournal.forEach((entry) => {
                              if (
                                entry.ref_type === "brokers_fee" &&
                                Date.parse(order.issued) ===
                                  Date.parse(entry.date)
                              ) {
                                newBrokersArray.push(
                                  Object.assign(
                                    {},
                                    new ESIBrokerFee(entry, order, char)
                                  )
                                );
                              }
                            });
                            let newMarketOrderArray =
                              activeJob.build.sale.marketOrders;
                            newMarketOrderArray.push(
                              Object.assign({}, new ESIMarketOrder(order))
                            );

                            let newUsers = [...users];
                            newUsers[ParentUserIndex].linkedOrders.push(
                              order.order_id
                            );
                            updateUsers(newUsers);
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

                            setSnackbarData((prev) => ({
                              ...prev,
                              open: true,
                              message: "Linked",
                              severity: "success",
                              autoHideDuration: 1000,
                            }));
                            setJobModified(true);
                            logEvent(analytics, "linkedMarketOrder", {
                              UID: users[ParentUserIndex].accountID,
                              isLoggedIn: isLoggedIn,
                            });
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
