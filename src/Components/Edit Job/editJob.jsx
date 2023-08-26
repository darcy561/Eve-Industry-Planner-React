import { useParams } from "react-router-dom";

export function EditJob_New() {
  const { jobID } = useParams();

  return <div>This is the edit job page for job {jobID}. </div>;
}
