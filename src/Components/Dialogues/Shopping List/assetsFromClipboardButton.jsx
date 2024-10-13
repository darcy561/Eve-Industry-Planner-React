import { useState } from "react";
import { Button, Tooltip } from "@mui/material";
import { useHelperFunction } from "../../../Hooks/GeneralHooks/useHelperFunctions";
import { useShoppingList } from "../../../Hooks/GeneralHooks/useShoppingList";

export function AssetsFromClipboardButton_ShoppingList({
  displayData,
  updateDisplayData,
  assetsFromClipboard,
  updateAssetsFromClipboard,
}) {
  const [displayClipboardData, updateDisplayClipboardData] = useState(false);
  const { importAssetsFromClipboard, clearAssetQuantities } = useShoppingList();
  const { sendSnackbarNotificationSuccess } = useHelperFunction();

  if (assetsFromClipboard) {
    return (
      <Button
        variant="contained"
        size="small"
        onClick={() => {
          const newDisplayData = [...displayData];
          clearAssetQuantities(newDisplayData);
          updateAssetsFromClipboard((prev) => !prev);
          updateDisplayData(newDisplayData);
          sendSnackbarNotificationSuccess("Assets Removed");
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
          updateAssetsFromClipboard((prev) => !prev);
          updateDisplayData(newDisplayData);
          sendSnackbarNotificationSuccess("Assets Applied");
        }}
      >
        Import Assets From Clipboard
      </Button>
    </Tooltip>
  );
}
