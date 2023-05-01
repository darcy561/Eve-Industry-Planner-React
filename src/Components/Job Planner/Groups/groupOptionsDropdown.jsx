import { IconButton, Menu, MenuItem } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useContext, useState } from "react";
import { useArchiveGroupJobs } from "../../../Hooks/GroupHooks/useArchiveGroupJobs";
import { JobPlannerPageTriggerContext } from "../../../Context/LayoutContext";
import { useBuildChildJobs } from "../../../Hooks/GroupHooks/useBuildChildJobs";
import { ActiveJobContext } from "../../../Context/JobContext";
import itemTypes from "../../../RawData/searchIndex.json";

export function GroupOptionsDropDown({ groupJobs }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const { archiveGroupJobs } = useArchiveGroupJobs();
  const { updateEditGroupTrigger } = useContext(JobPlannerPageTriggerContext);
  const { activeGroup } = useContext(ActiveJobContext);
  const { buildChildJobsNew } = useBuildChildJobs();

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton
        id="moreGroupOptionsButton"
        onClick={handleMenuClick}
        aria-controls={Boolean(anchorEl) ? "moreGroupOptionsMenu" : undefined}
        aria-haspopup="true"
        aria-expanded={Boolean(anchorEl) ? "true" : undefined}
      >
        <MoreVertIcon color="primary" />
      </IconButton>

      <Menu
        id="moreGroupOptionsMenu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        MenuListProps={{
          "aria-labelledby": "moreGroupOptionsButton",
        }}
      >
        <MenuItem
          onClick={async () => {
            const importedText = await navigator.clipboard.readText();

            const nameMatches = [
              ...importedText.matchAll(
                /^\[(?<itemName>.+),\s*(?<fittingName>.+)\]/g
              ),
            ];

            const itemMatches = [
              ...importedText.matchAll(/^[^\[\r\n]+|^(?:(?!\[|\sx\d).)+/gm),
            ];

            const itemsWithQuantities = [
              ...importedText.matchAll(
                /^(?<item>[^\n]*?)\s*x(?<quantity>\d+)/gm
              ),
            ];

            const filteredItemMatches = itemMatches
              .filter((match) => !match[0].match(/\sx\d/))
              .map((match) => match[0].trim());

            const objectArray = [
              { itemName: nameMatches[0].groups.itemName, quantity: 1 },
            ];

            filteredItemMatches.forEach((itemName) => {
              const foundItem = objectArray.find(
                (item) => item.itemName === itemName
              );
              if (foundItem) {
                foundItem.quantity += 1;
              } else {
                objectArray.push({ itemName, quantity: 1 });
              }
            });

            itemsWithQuantities.forEach((match) => {
              objectArray.push({
                itemName: match.groups.item,
                quantity: match.groups.quantity,
              });
            });

            for (let i = objectArray.length - 1; i >= 0; i--) {
              const matchingItemType = itemTypes.find(
                (itemType) => itemType.name === objectArray[i].itemName
              );
              if (matchingItemType) {
                objectArray[i].itemID = matchingItemType.itemID;
              } else {
                objectArray.splice(i, 1);
              }
            }
            console.log(objectArray);
          }}
        >
          Import Fit From Clipboard
        </MenuItem>
        <MenuItem
          onClick={() => {
            archiveGroupJobs(groupJobs);
            updateEditGroupTrigger((prev) => !prev);
          }}
        >
          Archive Group Jobs
        </MenuItem>
        <MenuItem
          onClick={() => {
            buildChildJobsNew(activeGroup.includedJobIDs);
          }}
        >
          test
        </MenuItem>
      </Menu>
    </>
  );
}
