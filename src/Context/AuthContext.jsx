import React, { createContext, useState } from "react";
import { userJobSnapshotDefault, usersDefault } from "./defaultValues";

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

export const FirebaseListenersContext = createContext();

export const FirebaseListeners = (props) => {
  const [firebaseListeners, updateFirebaseListeners] = useState([]);

  return (
    <FirebaseListenersContext.Provider
      value={{ firebaseListeners, updateFirebaseListeners }}
    >
      {props.children}
    </FirebaseListenersContext.Provider>
  );
};

export const UserJobSnapshotContext = createContext();

export const UserJobSnapshot = (props) => {
  const [userJobSnapshot, updateUserJobSnapshot] = useState(userJobSnapshotDefault);

  return (
    <UserJobSnapshotContext.Provider value={{userJobSnapshot, updateUserJobSnapshot}}>
      {props.children}
    </UserJobSnapshotContext.Provider>
  );
};

export const UserWatchlistContext = createContext();

export const UserWatchlist = (props) => {
  const [userWatchlist, updateUserWatchlist] = useState({groups:[], items:[]});

  return (
    <UserWatchlistContext.Provider value={{userWatchlist, updateUserWatchlist}}>
      {props.children}
    </UserWatchlistContext.Provider>
  );
};
