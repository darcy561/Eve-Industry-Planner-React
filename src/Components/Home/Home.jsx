import { Typography } from "@material-ui/core";
import React, { useContext, useEffect, useState } from "react";
import {
  IsLoggedInContext,
  MainUserContext,
  UsersContext,
} from "../../Context/AuthContext";
import { RefreshTokens } from "../Auth/RefreshToken";
import { CircularProgress } from "@material-ui/core";

export function Home() {
  const { users, updateUsers } = useContext(UsersContext);
  const { isLoggedIn, updateIsLoggedIn } = useContext(IsLoggedInContext);
  const { mainUser, updateMainUser } = useContext(MainUserContext);
  const [pageload, updatePageload] = useState(true);

  useEffect(() => {
    const rToken = localStorage.getItem("Auth");
    if (rToken != null) {
      const refreshedUser = RefreshTokens(rToken);
      refreshedUser.then((userData) => {
        userData.ParentUser = true;
        const newArray = [];
        newArray.push(userData);
        updateUsers(newArray);
        updateIsLoggedIn(true);
        updateMainUser(userData);
        updatePageload(false);
      });
    } else {
      updateIsLoggedIn(false);
      updatePageload(false);
    }
  }, []);

  if (pageload) {
    return pageload && <CircularProgress color="primary" />;
  } else {
    return (
      <>
        <section className="block-section">
          <div id="jobWrapper" className="jobsWrapper"></div>
          <a>Home</a>
          {users.map((user) => {
            return <Typography variant="h5">{user.CharacterName}</Typography>;
          })}
        </section>
      </>
    );
  }
}
