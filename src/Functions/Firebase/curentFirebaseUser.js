import { auth } from "../../firebase";

export function getCurrentFirebaseUser() {
  const user = auth.currentUser;
  if (user) {
    return user.uid;
  } else {
    return "LoggedOutUser";
  }
}
