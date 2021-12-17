import React, { useContext, useState } from "react";
import {
  Container,
  Divider,
  Grid,
  IconButton,
  TextField,
  Typography,
} from "@material-ui/core";
import { ActiveJobContext } from "../../../../Context/JobContext";
import { MdAdd } from "react-icons/md";
import { BiMinus } from "react-icons/bi";

export function EditPage5({ setJobModified }) {
  const { activeJob, updateActiveJob } = useContext(ActiveJobContext);
  const [fee, updateFee] = useState({ id: 0, value: 0 });
  const [transaction, updateTransaction] = useState({
    sold: 0,
    price: 0,
    fee: 0,
  });

  let brokersFeesTotal = 0;
  activeJob.job.sale.brokersFee.forEach(
    (item) => (brokersFeesTotal += item.value)
  );
  let transactionFeeTotal = 0;
  activeJob.job.sale.transactions.forEach(
    (item) => (transactionFeeTotal += item.fee)
  );

  return (
    <Container maxWidth="xl" disableGutters={true}>
      <Grid container xs={12}>
        <Grid container item xs={12} md={6}>
          <Grid item xs={12}>
            <Typography variant="body2">
              Items Sold {activeJob.job.sale.totalSold.toLocaleString()}/
              {activeJob.job.products.totalQuantity.toLocaleString()}
            </Typography>
            <Divider />
            {activeJob.job.sale.transactions.map((item) => {
              return (
                <Grid key={item.id} container direction="row">
                  <Grid item xs={3}>
                    <Typography variant="body2">
                      {item.sold.toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2">
                      {item.price.toLocaleString()} ISK
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2">
                      {item.fee.toLocaleString()} ISK
                    </Typography>
                  </Grid>
                  <Grid item xs={1}>
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={() => {
                        const newTransactionsArray =
                          activeJob.job.sale.transactions;
                        const x = newTransactionsArray.findIndex(
                          (transItem) => item.id === transItem.id
                        );
                        newTransactionsArray.splice(x, 1);
                        updateActiveJob((prevObj) => ({
                          ...prevObj,
                          job: {
                            ...prevObj.job,
                            sale: {
                              ...prevObj.job.sale,
                              transactions: newTransactionsArray,
                              totalSold: (activeJob.job.sale.totalSold -=
                                item.sold),
                              totalSale: (activeJob.job.sale.totalSale -=
                                item.price),
                            },
                          },
                        }));
                        setJobModified(true);
                      }}
                    >
                      <BiMinus />
                    </IconButton>
                  </Grid>
                </Grid>
              );
            })}
            <Divider />
          </Grid>
          {activeJob.job.sale.totalSold <=
          activeJob.job.products.totalQuantity ? (
            <Grid container xs={12}>
              <Grid item xs={3}>
                <TextField
                  defaultValue={transaction.sold}
                  variant="outlined"
                  helperText="Number Sold"
                  type="number"
                  onBlur={(e) => {
                    updateTransaction((prevState) => ({
                      ...prevState,
                      sold: Number(e.target.value),
                    }));
                  }}
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  defaultValue={transaction.price}
                  variant="outlined"
                  helperText="Sale Total"
                  type="number"
                  onBlur={(e) => {
                    updateTransaction((prevState) => ({
                      ...prevState,
                      price: Number(e.target.value),
                    }));
                  }}
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  defaultValue={transaction.fee}
                  variant="outlined"
                  helperText="Transaction Fee"
                  type="number"
                  onBlur={(e) => {
                    updateTransaction((prevState) => ({
                      ...prevState,
                      fee: Number(e.target.value),
                    }));
                  }}
                />
              </Grid>
              <Grid item xs={1}>
                <IconButton
                  color="primary"
                  onClick={() => {
                    const newTransactionsArray =
                      activeJob.job.sale.transactions;
                    newTransactionsArray.push({
                      id: Date.now(),
                      sold: transaction.sold,
                      price: transaction.price,
                      fee: transaction.fee,
                    });
                    updateActiveJob((prevObj) => ({
                      ...prevObj,
                      job: {
                        ...prevObj.job,
                        sale: {
                          ...prevObj.job.sale,
                          transactions: newTransactionsArray,
                          totalSold: (activeJob.job.sale.totalSold +=
                            transaction.sold),
                          totalSale: (activeJob.job.sale.totalSale +=
                            transaction.price),
                        },
                      },
                    }));
                    setJobModified(true);
                  }}
                >
                  <MdAdd />
                </IconButton>
              </Grid>
              <Grid item xs={1} />
            </Grid>
          ) : null}
        </Grid>
        <Grid container item xs={12} md={6}>
          <Grid item xs={12}>
            <Typography variant="body2">Brokers Fees</Typography>
            <Divider />
            <Grid container direction="row" xs={12}>
              <Grid item xs={5} md={5}>
                {activeJob.job.sale.brokersFee.map((item) => {
                  return (
                    <Grid key={item.id} container direction="row">
                      <Grid item xs={10}>
                        <Typography variant="body2">
                          {item.value.toLocaleString()} ISK
                        </Typography>
                      </Grid>
                      <Grid item xs={2}>
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => {
                            const newBrokersArray =
                              activeJob.job.sale.brokersFee;
                            const x = newBrokersArray.findIndex(
                              (feeItem) => item.value === feeItem.value
                            );
                            newBrokersArray.splice(x, 1);
                            updateActiveJob((prevObj) => ({
                              ...prevObj,
                              job: {
                                ...prevObj.job,
                                sale: {
                                  ...prevObj.job.sale,
                                  brokersFee: newBrokersArray,
                                },
                              },
                            }));
                            setJobModified(true);
                          }}
                        >
                          <BiMinus />
                        </IconButton>
                      </Grid>
                    </Grid>
                  );
                })}
              </Grid>
              <Grid item xs={1} md={2} />
              <Grid item xs={5} md={3}>
                <TextField
                  defaultValue={fee.value}
                  variant="outlined"
                  helperText="Fee"
                  type="number"
                  onBlur={(e) => {
                    updateFee((prevState) => ({
                      ...prevState,
                      value: Date.now(),
                      value: Number(e.target.value),
                    }));
                  }}
                />
              </Grid>
              <Grid item xs={1}>
                <IconButton
                  color="primary"
                  onClick={() => {
                    const newBrokersArray = activeJob.job.sale.brokersFee;
                    newBrokersArray.push({ id: Date.now(), value: fee.value });
                    updateActiveJob((prevObj) => ({
                      ...prevObj,
                      job: {
                        ...prevObj.job,
                        sale: {
                          ...prevObj.job.sale,
                          brokersFee: newBrokersArray,
                        },
                      },
                    }));
                    setJobModified(true);
                  }}
                >
                  <MdAdd />
                </IconButton>
              </Grid>
            </Grid>

            <Divider />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2">
              Total Build Cost:{" "}
              {(
                activeJob.job.costs.totalPurchaseCost +
                activeJob.job.costs.installCosts +
                activeJob.job.costs.extrasTotal
              ).toLocaleString()}
              ISK
            </Typography>
            <Typography variant="body2">
              Brokers Fee Total: {brokersFeesTotal.toLocaleString()} ISK
            </Typography>
            <Typography variant="body2">
              Transaction Fee Total: {transactionFeeTotal.toLocaleString()} ISK
            </Typography>
            <Typography variant="body2">
              Total Cost:{" "}
              {(
                activeJob.job.costs.totalPurchaseCost +
                activeJob.job.costs.installCosts +
                activeJob.job.costs.extrasTotal +
                brokersFeesTotal +
                transactionFeeTotal
              ).toLocaleString()}{" "}
              ISK
            </Typography>
            <Typography variant="body2">
              Total Cost Per Item:{" "}
              {(
                Math.round(
                  ((activeJob.job.costs.totalPurchaseCost +
                    activeJob.job.costs.installCosts +
                    activeJob.job.costs.extrasTotal +
                    brokersFeesTotal +
                    transactionFeeTotal) /
                    activeJob.job.products.totalQuantity +
                    Number.EPSILON) *
                    100
                ) / 100
              ).toLocaleString()}{" "}
              ISK
            </Typography>
            <Divider />
            <Typography variant="body2">
              Total Of Sales: {activeJob.job.sale.totalSale.toLocaleString()}{" "}
              ISK
            </Typography>
            <Typography variant="body2">
              Average Sale Price Per Item:{" "}
              {(
                Math.round(
                  (activeJob.job.sale.totalSale /
                    activeJob.job.products.totalQuantity +
                    Number.EPSILON) *
                    100
                ) / 100
              ).toLocaleString()}{" "}
              ISK
            </Typography>
            <Typography variant="body2">
              Profit/Loss:{" "}
              {(
                activeJob.job.sale.totalSale -
                (activeJob.job.costs.totalPurchaseCost +
                  activeJob.job.costs.installCosts +
                  activeJob.job.costs.extrasTotal +
                  brokersFeesTotal +
                  transactionFeeTotal)
              ).toLocaleString()}{" "}
              ISK
            </Typography>
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
}
