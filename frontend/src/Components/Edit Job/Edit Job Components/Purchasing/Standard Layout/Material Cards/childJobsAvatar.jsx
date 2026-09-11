import { Avatar, Tooltip } from "@mui/material";
import checkJobTypeIsBuildable from "../../../../../../Functions/Helper/checkJobTypeIsBuildable";

export function ChildJobsAvatar_Purchasing({ material, onOpen, childJobs }) {
  const displayItem = checkJobTypeIsBuildable(material.jobType);

  if (!displayItem) return null;

  return (
    <Tooltip
      title="Number of child jobs linked, click to add or remove."
      arrow
      placement="top"
    >
      <Avatar
        variant="circle"
        sx={{
          color: "white",
          bgcolor: "primary.main",
          height: 30,
          width: 30,
          cursor: "pointer",
          boxShadow: 4,
        }}
        onClick={onOpen}
      >
        {childJobs.length}
      </Avatar>
    </Tooltip>
  );
}
