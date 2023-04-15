import {
  Avatar,
  Checkbox,
  Grid,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { EvePricesContext } from "../../../../Context/EveDataContext";
import { PriceEntryListContext } from "../../../../Context/LayoutContext";
import { makeStyles } from "@mui/styles";

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
  Checkbox: {
    color:
      theme.palette.type === "dark"
        ? theme.palette.primary.main
        : theme.palette.secondary.main,
  },
}));

export function ItemPriceRow({
  item,
  index,
  displayOrder,
  displayMarket,
  totalImportedCost,
  updateTotalImportedCost,
  importFromClipboard,
  updateImportFromClipboard,
}) {
  const { priceEntryListData, updatePriceEntryListData } = useContext(
    PriceEntryListContext
  );
  const { evePrices } = useContext(EvePricesContext);
  let materialPrice = evePrices.find((i) => i.typeID === item.typeID);

  if (materialPrice === undefined) {
    materialPrice = {
      amarr: {
        buy: 0,
        sell: 0,
      },
      dodixie: {
        buy: 0,
        sell: 0,
      },
      jita: {
        buy: 0,
        sell: 0,
      },
      typeID: item.typeID,
      lastUpdated: 0,
    };
  }
  const [inputItem, updateInputItem] = useState(
    Number(materialPrice[displayMarket][displayOrder])
  );
  const [inputChecked, updateInputChecked] = useState(item.confirmed);
  const classes = useStyles();
  useEffect(() => {
    if (!item.confirmed) {
      updateInputItem(Number(materialPrice[displayMarket][displayOrder]));
      item.itemPrice = Number(materialPrice[displayMarket][displayOrder]);
    }
  }, [displayMarket, displayOrder, evePrices]);

  useEffect(() => {
    updateInputChecked(item.confirmed);
  }, [priceEntryListData]);

  useEffect(() => {
    if (importFromClipboard) {
      updateInputItem(item.itemPrice);
      updateImportFromClipboard(false);
    }
  }, [importFromClipboard]);

  useEffect(() => {
    item.itemPrice = Number(inputItem);
  }, []);
  return (
    <Grid
      key={item.typeID}
      container
      item
      xs={12}
      justifyContent="center"
      alignItems="center"
    >
      <Grid
        item
        sm={1}
        sx={{
          display: { xs: "none", sm: "block" },
          paddingRight: "5px",
        }}
        align="center"
      >
        <Avatar
          src={`https://images.evetech.net/types/${item.typeID}/icon?size=32`}
          alt={item.name}
          variant="square"
          sx={{ height: 32, width: 32 }}
        />
      </Grid>
      <Grid item xs={12} sm={7}>
        <Typography sx={{ typography: { xs: "body2", sm: "body1" } }}>
          {item.name}
        </Typography>
      </Grid>
      <Grid item xs={10} sm={3}>
        <Tooltip
          title={inputItem.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          })}
          arrow
          placement="left"
        >
          <TextField
            className={classes.TextField}
            disabled={item.confirmed}
            size="small"
            variant="standard"
            type="number"
            value={inputItem}
            inputProps={{ step: "0.01" }}
            onChange={(e) => {
              let newList = [...priceEntryListData.list];
              newList[index].itemPrice = e.target.value;
              updateInputItem(Number(e.target.value));
              updatePriceEntryListData((prev) => ({
                ...prev,
                list: newList,
              }));
            }}
          />
        </Tooltip>
      </Grid>
      <Grid item xs={2} sm={1}>
        <Tooltip title="Tick To Confirm Cost" arrow placement="right">
          <Checkbox
            className={classes.Checkbox}
            checked={inputChecked}
            size="small"
            onChange={() => {
              let newList = [...priceEntryListData.list];
              if (newList[index].confirmed) {
                updateTotalImportedCost(
                  (prev) => (prev -= inputItem * newList[index].quantity)
                );
              } else {
                updateTotalImportedCost(
                  (prev) => (prev += inputItem * newList[index].quantity)
                );
              }
              newList[index].confirmed = !inputChecked;
              newList[index].itemPrice = inputItem;
              updateInputChecked(!inputChecked);
              updatePriceEntryListData((prev) => ({
                ...prev,
                list: newList,
              }));
            }}
          />
        </Tooltip>
      </Grid>
    </Grid>
  );
}
