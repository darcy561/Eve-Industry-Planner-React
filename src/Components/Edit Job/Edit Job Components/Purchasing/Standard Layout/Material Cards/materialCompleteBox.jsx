import { Box, Typography } from "@mui/material";

export function MaterialCompleteBox_Purchasing({ material }) {
  if (material.quantityPurchased !== material.quantity) return null;

  return (
    <Box
      sx={{
        backgroundColor: "manufacturing.main",
        borderRadius: "5px",
        marginLeft: "auto",
        marginRight: "auto",
        marginTop: "13px",
        padding: "8px",
      }}
    >
      <Typography>Complete</Typography>
    </Box>
  );
}
