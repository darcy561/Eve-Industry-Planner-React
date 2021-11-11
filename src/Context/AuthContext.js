import React, { createContext, useState } from 'react';

export const UsersContext = createContext();

export const Users = (props) => {
    const [users, updateUsers] = useState([]);

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

export const MainUserContext = createContext();

export const MainUser = (props) => {
    const [mainUser, updateMainUser] = useState({});

    return (
        <MainUserContext.Provider value={{ mainUser, updateMainUser }}>
            {props.children}
        </MainUserContext.Provider>
    );
};