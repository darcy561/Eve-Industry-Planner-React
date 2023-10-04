import { Tooltip, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useDeleteSingleJob } from "../../Hooks/JobHooks/useDeleteSingleJob";
import { useNavigate } from "react-router-dom";


export function DeleteJobIcon({activeJob}) {
  const { deleteSingleJob } = useDeleteSingleJob();
  const navigate = useNavigate();
    
    return (
        <Tooltip
        title="Deletes the job from the job planner."
        arrow
        placement="bottom"
      >
        <IconButton
          variant="contained"
          color="error"
          onClick={async () => {
            await deleteSingleJob(activeJob.jobID)
            navigate("/jobplanner")
          }}
          size="medium"
          sx={{ marginRight: { xs: "20px", sm: "40px" } }}
        >
          <DeleteIcon />
        </IconButton>
      </Tooltip>
    )
}