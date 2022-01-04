import React, { useContext } from "react";
import { Grid, Typography } from "@mui/material";
import { UsersContext } from "../../../Context/AuthContext";
import { JobArrayContext } from "../../../Context/JobContext";
import { AccountData } from "./Logged In Components/AccountData";
import { NewTransactions } from "./Logged In Components/NewTransactions";

export function LoggedInHome() {
  const { users } = useContext(UsersContext);
  const { jobArray } = useContext(JobArrayContext);
  return (
    <Grid
      container
      sx={{
        marginTop: "5px",
      }}
      spacing={2}
    >
      <Grid item xs={12} md={6} lg={4}>
        <AccountData />
      </Grid>
      <Grid item xs={12} md={6} lg={8}>
        <NewTransactions/>
      </Grid>
    </Grid>
  );
}
