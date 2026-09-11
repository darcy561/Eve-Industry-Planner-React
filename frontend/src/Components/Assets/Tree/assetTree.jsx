import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Grid, Typography } from "@mui/material";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import AssetTreeRow from "./assetTreeRow";
import flattenAssetTree from "../../../Functions/Assets/flattenAssetTree";

const ESTIMATED_ROW_HEIGHT = 40;

/**
 * The asset tree, however many rows deep it goes.
 *
 * Only the rows in view are mounted, and each is measured rather than assumed: a location header,
 * a hangar division and a stack are all different heights.
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

  // The window virtualiser measures scroll against the whole page, so it needs
  // the distance down to the list. Measured after layout rather than read off
  // the ref while rendering, which would be null on the first pass and leave
  // the virtualiser believing the list starts at the top of the document.
  const [scrollMargin, setScrollMargin] = useState(0);
  // Deliberately measured on every commit: what sits above the list can change
  // height without this component hearing about it. The updater returns the
  // value it was given when nothing moved, so React bails out and there is no
  // chain of updates for the rule to worry about.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const measured = listRef.current?.offsetTop ?? 0;
    setScrollMargin((current) => (current === measured ? current : measured));
  });

  const virtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    overscan: 8,
    getItemKey: useCallback((index) => rows[index].key, [rows]),
    scrollMargin,
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
    <Grid ref={listRef} container size={12}>
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
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${
                  item.start - virtualizer.options.scrollMargin
                }px)`,
              }}
            >
              <AssetTreeRow
                row={row}
                expanded={expanded.has(row.key)}
                onToggle={() => onToggle(row.key)}
                fullItemList={fullItemList}
                containerNames={containerNames}
              />
            </div>
          );
        })}
      </div>
    </Grid>
  );
}
