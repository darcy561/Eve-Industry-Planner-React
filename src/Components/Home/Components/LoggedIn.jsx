import React, { useContext } from "react";
import { Typography } from "@mui/material";
import { UsersContext } from "../../../Context/AuthContext";
import { JobArrayContext } from "../../../Context/JobContext";

export function LoggedInHome() {
  const { users } = useContext(UsersContext);
  const { jobArray } = useContext(JobArrayContext);
  return users.map((user) => {
    return (
      <>
        <Typography variant="h5">{user.CharacterName}</Typography>
        <Typography variant="h5">{jobArray.length}</Typography>
      </>
    );
  });
}
