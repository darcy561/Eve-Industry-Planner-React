import { useContext, useState } from "react";
import { Button, Tooltip } from "@mui/material";
import { useShoppingList } from "../../../../Hooks/GeneralHooks/useShoppingList";
import { SnackBarDataContext } from "../../../../Context/LayoutContext";

export function AssetsFromClipboardButton_ShoppingList({
  displayData,
  updateDisplayData,
}) {
  const { setSnackbarData } = useContext(SnackBarDataContext);
  const [displayClipboardData, updateDisplayClipboardData] = useState(false);
  const { importAssetsFromClipboard, clearAssetQuantities } = useShoppingList();

  if (displayClipboardData) {
    return (
      <Button
        variant="contained"
        size="small"
        onClick={() => {
          const newDisplayData = [...displayData];
          clearAssetQuantities(newDisplayData);
          updateDisplayClipboardData((prev) => !prev);
          updateDisplayData(newDisplayData);
          setSnackbarData((prev) => ({
            ...prev,
            open: true,
            message: `Assets Removed`,
            severity: "success",
            autoHideDuration: 1000,
          }));
        }}
      >
        Remove Imported Assets
      </Button>
    );
  }

  return (
    <Tooltip
      title="Copy assets from inventory while in the icon view mode. "
      arrow
      placement="bottom"
    >
      <Button
        variant="contained"
        size="small"
        sx={{ display: { xs: "none", sm: "block" } }}
        onClick={async () => {
          const newDisplayData = await importAssetsFromClipboard(displayData);
          updateDisplayClipboardData((prev) => !prev);
          updateDisplayData(newDisplayData);
          setSnackbarData((prev) => ({
            ...prev,
            open: true,
            message: `Assets Applied`,
            severity: "success",
            autoHideDuration: 1000,
          }));
        }}
      >
        Import Assets From Clipboard
      </Button>
    </Tooltip>
  );
}
