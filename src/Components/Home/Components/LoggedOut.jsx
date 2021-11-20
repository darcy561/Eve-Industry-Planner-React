import React from "react";
import { Typography } from "@material-ui/core";

export function LoggedOutHome() { 
    return (
        <>
            <Typography variant="body2">{process.env.REACT_APP_eveClientID}</Typography>
        </>
    );    
};