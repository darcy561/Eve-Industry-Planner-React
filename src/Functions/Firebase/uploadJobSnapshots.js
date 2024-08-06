import { doc, updateDoc } from "firebase/firestore";
import getCurrentFirebaseUser from "./currentFirebaseUser";
import { firestore } from "../../firebase";

async function uploadJobSnapshotsToFirebase(snapshotArray) {
  try {
    if (!snapshotArray) {
      throw new Error("Snapshot array is null or undefined");
    }

    const uid = getCurrentFirebaseUser();

    if (!uid) {
      throw new Error("No authenticated user found");
    }
    await updateDoc(doc(firestore, `Users/${uid}/ProfileInfo`, "JobSnapshot"), {
      snapshot: snapshotArray.map((snap) => snap.toDocument()),
    });
  } catch (err) {
    console.error("Error uploading snapshots:", err);
  }
}

export default uploadJobSnapshotsToFirebase;
