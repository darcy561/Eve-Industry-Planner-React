import { doc, updateDoc } from "firebase/firestore";
import { firestore } from "../../firebase";
import getCurrentFirebaseUser from "./currentFirebaseUser";

async function uploadGroupsToFirebase(groupSnapshot) {
  try {
    if (!groupSnapshot) {
      throw new Error("Group Snapshot is null or undefined");
    }

    const uid = getCurrentFirebaseUser();

    if (!uid) {
      throw new Error("No authenticated user found");
    }

    const groupObjects = groupSnapshot.map((group) => group.toDocument());

    await updateDoc(doc(firestore, `Users/${uid}/ProfileInfo`, "GroupData"), {
      groupData: groupObjects,
    });
  } catch (err) {
    console.error(`Error uploading group data to Firebase ${err}`);
  }
}

export default uploadGroupsToFirebase;
