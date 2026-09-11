import { useCallback, useMemo, useRef } from "react";
import { Box, Grid, Typography, useMediaQuery } from "@mui/material";
import { useVirtualizer } from "@tanstack/react-virtual";
import AssetTreeRow, { assetRowHeight } from "./assetTreeRow";
import flattenAssetTree from "../../../Functions/Assets/flattenAssetTree";

/**
 * The asset tree, however many rows deep it goes.
 *
 * Only the rows in view are mounted, and each kind states its own height rather than being
 * measured: a location header, a hangar division and a stack are all different heights.
 *
 * @param {{
 *   locations: Array<Object>,
 *   byItemId: Map<number, Object>,
 *   fullItemList: Object,
 *   containerNames: Map<number, {name: string}>,
 *   excludeItemIds?: Set<number>,
 *   compartments?: Array<{assetLocationRef: string, name: string}>,
 *   expanded: Set<string>,
 *   onToggle: (key: string) => void,
 *   search?: string
 * }} props
 */
export default function AssetTree({
  locations,
  byItemId,
  fullItemList,
  containerNames,
  excludeItemIds,
  compartments,
  expanded,
  onToggle,
  search,
}) {
  const listRef = useRef(null);
  const deviceNotMobile = useMediaQuery((theme) => theme.breakpoints.up("sm"));

  const rows = useMemo(
    () =>
      flattenAssetTree({
        locations,
        expanded,
        byItemId,
        fullItemList,
        compartments,
        excludeItemIds,
        containerNames,
        search,
      }),
    [
      locations,
      expanded,
      byItemId,
      fullItemList,
      compartments,
      excludeItemIds,
      containerNames,
      search,
    ],
  );

  // The list scrolls inside itself, so the virtualiser measures against this
  // element rather than the page and needs no notion of where on the page it
  // sits. Row heights are stated by their kind rather than measured, so nothing
  // has to mount to be sized.
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => listRef.current,
    estimateSize: useCallback(
      (index) => assetRowHeight(rows[index].kind, deviceNotMobile),
      [rows, deviceNotMobile],
    ),
    overscan: 8,
    getItemKey: useCallback((index) => rows[index].key, [rows]),
  });

  if (rows.length === 0) {
    return (
      <Grid container align="center" size={12} sx={{ paddingY: 4 }}>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ width: "100%" }}
        >
          {search?.trim()
            ? "Nothing here matches that"
            : "Nothing held in this view"}
        </Typography>
      </Grid>
    );
  }

  return (
    <Box
      ref={listRef}
      sx={{ flex: 1, minHeight: 0, width: "100%", overflowY: "auto" }}
    >
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((item) => {
          const row = rows[item.index];
          return (
            <div
              key={item.key}
              data-index={item.index}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${item.size}px`,
                transform: `translateY(${item.start}px)`,
              }}
            >
              <AssetTreeRow
                row={row}
                height={item.size}
                expanded={expanded.has(row.key)}
                onToggle={() => onToggle(row.key)}
                fullItemList={fullItemList}
                containerNames={containerNames}
              />
            </div>
          );
        })}
      </div>
    </Box>
  );
}
