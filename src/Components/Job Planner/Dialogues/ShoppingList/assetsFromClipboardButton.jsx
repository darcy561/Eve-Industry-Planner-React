import { useState } from "react";
import { Button, Tooltip } from "@mui/material";
import { useShoppingList } from "../../../../Hooks/GeneralHooks/useShoppingList";
import { useHelperFunction } from "../../../../Hooks/GeneralHooks/useHelperFunctions";

export function AssetsFromClipboardButton_ShoppingList({
  displayData,
  updateDisplayData,
}) {
  const [displayClipboardData, updateDisplayClipboardData] = useState(false);
  const { importAssetsFromClipboard, clearAssetQuantities } = useShoppingList();
  const { sendSnackbarNotificationSuccess } = useHelperFunction();

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
          updateDisplayClipboardData((prev) => !prev);
          updateDisplayData(newDisplayData);
          sendSnackbarNotificationSuccess("Assets Applied");
        }}
      >
        Import Assets From Clipboard
      </Button>
    </Tooltip>
  );
}
