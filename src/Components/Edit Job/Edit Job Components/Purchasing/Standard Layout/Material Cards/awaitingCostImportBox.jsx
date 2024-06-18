import { Box, Typography } from "@mui/material";

export function AwaitingCostImportBox_Purchasing({
  material,
  childJobs,
  childJobProductionTotal,
}) {
  if (childJobs.length === 0) return null;

  function findImportStatus() {
    let costNotImported = true;
    for (const job of childJobs) {
      const matchedCostImport = material.purchasing.find(
        (i) => i.childID === job.jobID
      );
      if (!matchedCostImport) continue;
      costNotImported = false;
    }
    return costNotImported;
  }

  const awaitingCostImport = findImportStatus();

  if (!awaitingCostImport) return null;

  return (
    <Box
      sx={{
        marginLeft: "auto",
        marginRight: "auto",
        marginTop: "5px",
        padding: "8px",
      }}
    >
      <Typography
        sx={{ typography: { xs: "body1", sm: "h6" } }}
        align="center"
        color="primary"
      >
        Awaiting Cost Import
      </Typography>
    </Box>
  );
}
