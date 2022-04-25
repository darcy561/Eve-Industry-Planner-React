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
import {
  IsLoggedInContext,
  UsersContext,
} from "../../../../../Context/AuthContext";
import AddLinkIcon from "@mui/icons-material/AddLink";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { SnackBarDataContext } from "../../../../../Context/LayoutContext";
import { getAnalytics, logEvent } from "firebase/analytics";

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
    this.location_name = order.location_name || null;
    this.order_id = order.order_id;
    this.item_price = order.price;
    this.range = order.range;
    this.region_id = order.region_id;
    this.region_name = order.region_name || null;
    this.type_id = order.type_id;
    this.item_name = order.item_name || null;
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
  const { users, updateUsers } = useContext(UsersContext);
  const [anchorEl, setAnchorEl] = useState(null);
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const { isLoggedIn } = useContext(IsLoggedInContext);
  const analytics = getAnalytics();

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

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
            return (
              <Grid key={order.order_id} container>
                <Grid container item sx={{ marginBottom: "10px" }}>
                  <Grid item xs={4}>
                    <Avatar
                      src={`https://images.evetech.net/characters/${charData.CharacterID}/portrait`}
                      variant="circular"
                      sx={{
                        height: "32px",
                        width: "32px",
                      }}
                    />
                  </Grid>
                </Grid>
                <Grid container item>
                  <Grid item xs={12} sm={5}>
                    <Typography variant="body1">
                      {order.price.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      ISK
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={7}>
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
                </Grid>
                <Grid container item xs={12}>
                  <Grid item xs={5}>
                    <Typography variant="body2">Last Updated:</Typography>
                  </Grid>
                  <Grid item xs={7}>
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
                          const ParentUserIndex = users.findIndex(
                            (i) => i.ParentUser === true
                          );
                          const char = users.find(
                            (user) => user.CharacterHash === order.CharacterHash
                          );
                          let newBrokersArray = [];
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
    </Grid>
  );
}
