import { useLayoutEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

/** How tall the open list is before it scrolls. */
const LISTBOX_HEIGHT = 250;

/**
 * The listbox an app-shell autocomplete opens onto, with only the rows in view mounted.
 *
 * A plain listbox mounts every option, which a list of thousands cannot afford — and a plain
 * `Select` menu cannot be typed into at all, so a long list has to be scrolled past rather than
 * searched. Every autocomplete over a long list uses this.
 *
 * `virtualizerControlRef` is filled with a `scrollToIndex`, because the virtualiser is what has to
 * move when the keyboard moves the highlight onto a row that is not mounted.
 *
 * @param {{children: React.ReactNode, virtualizerControlRef?: {current: Object|null}, ref?: Object}} props
 */
export default function VirtualisedListbox({
  children,
  virtualizerControlRef,
  ref,
  ...other
}) {
  const childItems = Array.isArray(children)
    ? children
    : [children].filter(Boolean);
  const itemCount = childItems.length;

  const parentRef = useRef();

  const virtualizer = useVirtualizer({
    count: itemCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 5,
  });

  useLayoutEffect(() => {
    if (!virtualizerControlRef) return;
    virtualizerControlRef.current = {
      scrollToIndex: (index) => {
        if (
          typeof index !== "number" ||
          !Number.isFinite(index) ||
          index < 0 ||
          index >= itemCount
        ) {
          return;
        }
        virtualizer.scrollToIndex(index, { align: "auto" });
      },
    };
    return () => {
      virtualizerControlRef.current = null;
    };
  }, [virtualizer, virtualizerControlRef, itemCount]);

  return (
    <div ref={ref} {...other}>
      <div
        ref={parentRef}
        style={{ height: LISTBOX_HEIGHT, overflow: "auto", width: "100%" }}
      >
        <div
          style={{
            height: virtualizer.getTotalSize(),
            width: "100%",
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {childItems[virtualItem.index]}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
