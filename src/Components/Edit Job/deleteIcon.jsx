import { Tooltip, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";


export function DeleteJobIcon() {
    
    return (
        <Tooltip
        title="Deletes the job from the job planner."
        arrow
        placement="bottom"
      >
        <IconButton
          variant="contained"
          color="error"
          onClick={async () => {}}
          size="medium"
          sx={{ marginRight: { xs: "20px", sm: "40px" } }}
        >
          <DeleteIcon />
        </IconButton>
      </Tooltip>
    )
}