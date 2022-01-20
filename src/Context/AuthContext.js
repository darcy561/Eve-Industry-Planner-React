import React, { createContext, useState } from 'react';
import { usersDefault } from "./defaultValues";

export const UsersContext = createContext();

export const Users = (props) => {
    const [users, updateUsers] = useState(usersDefault);

    return (
        <UsersContext.Provider value={{ users, updateUsers }}>
            {props.children}
        </UsersContext.Provider>
    );
};

export const IsLoggedInContext = createContext();

export const IsLoggedIn = (props) => {
    const [isLoggedIn, updateIsLoggedIn] = useState(false);

    return (
        <IsLoggedInContext.Provider value={{ isLoggedIn, updateIsLoggedIn }}>
            {props.children}
        </IsLoggedInContext.Provider>
    );
};