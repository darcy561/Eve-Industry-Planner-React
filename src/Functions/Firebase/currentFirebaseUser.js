import { auth } from "../../firebase";

export function getCurrentFirebaseUser() {
  const user = auth.currentUser;
  return user ? user.uid : null;
}

export default getCurrentFirebaseUser;
