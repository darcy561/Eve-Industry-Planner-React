package conversion

import (
	"fmt"
	"regexp"
	"strconv"
)

var (
	skinRegex     = regexp.MustCompile(`(?i)skin`)
	reactionRegex = regexp.MustCompile(`(?i)reaction `)
)

func GenerateFullItemListOutput(combinedItemMap map[string]*EVEType, marketGroupsMap map[string]any, categoryByGroupID map[int]int) map[string]*FullItem {
	fullItemList := make(map[string]*FullItem)
	for key, value := range combinedItemMap {
		if !shouldRemoveItem(value, marketGroupsMap) {
			fullItemList[key] = &FullItem{
				TypeID:     value.ItemID,
				Name:       value.Name,
				CategoryID: categoryByGroupID[value.GroupID],
			}
		}
	}
	return fullItemList
}

// BuildCategoryByGroupID maps each group to the category it belongs to.
//
// A type names only its group, and what the SPA asks of an item — whether it is a ship — is a
// question about its category, so the two have to be joined before the item list is written.
func BuildCategoryByGroupID(groupsMap map[string]any) map[int]int {
	byGroupID := make(map[int]int, len(groupsMap))
	for key, value := range groupsMap {
		groupID, err := strconv.Atoi(key)
		if err != nil {
			continue
		}
		group, ok := value.(map[string]any)
		if !ok {
			continue
		}
		categoryID, ok := group["categoryID"].(float64)
		if !ok {
			continue
		}
		byGroupID[groupID] = int(categoryID)
	}
	return byGroupID
}

func shouldRemoveItem(item *EVEType, marketGroupsMap map[string]any) bool {
	return item.MarketGroupID == 0 || skinRegex.MatchString(item.Name) || isBlueprintAndVolumeLessThanOne(item, marketGroupsMap) || reactionRegex.MatchString(item.Name)
}

func isBlueprintAndVolumeLessThanOne(item *EVEType, marketGroupsMap map[string]any) bool {
	parentGroupIDsToIgnore := map[int]bool{2: true}
	parentGroupIDStr := findParentGroupFromMarketGroup(item, marketGroupsMap)
	if parentGroupIDStr == "" {
		return false
	}
	parentGroupID, err := strconv.Atoi(parentGroupIDStr)
	if err != nil {
		return false
	}
	return parentGroupIDsToIgnore[parentGroupID]
}

func findParentGroupFromMarketGroup(item *EVEType, marketGroupsMap map[string]any) string {
	if item.MarketSectionID == 0 {
		return ""
	}
	keyToFind := fmt.Sprintf("%d", item.MarketSectionID)
	matchedGroupData, exists := marketGroupsMap[keyToFind]
	if !exists {
		return ""
	}
	matchedGroup, ok := matchedGroupData.(map[string]any)
	if !ok {
		return ""
	}
	parentGroupID, ok := matchedGroup["parentGroupID"].(float64)
	if !ok || parentGroupID == 0 {
		return ""
	}
	parentKey := fmt.Sprintf("%.0f", parentGroupID)
	if _, parentExists := marketGroupsMap[parentKey]; !parentExists {
		return ""
	}
	return parentKey
}
