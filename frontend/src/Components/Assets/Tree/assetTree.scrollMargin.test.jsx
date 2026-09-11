import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";

const { calls } = vi.hoisted(() => ({ calls: [] }));

vi.mock("@tanstack/react-virtual", () => ({
  useWindowVirtualizer: (options) => {
    calls.push(options);
    return {
      getTotalSize: () => 0,
      getVirtualItems: () => [],
      measureElement: () => {},
      options,
    };
  },
}));

const { default: AssetTree } = await import("./assetTree.jsx");
const { default: buildAssetNodes } =
  await import("../../../Functions/Assets/buildAssetNodes");
const { assetRowsByLocation } =
  await import("../../../Functions/Assets/assetTree");
const { stubElementHeights } = await import("../../../tests/elementHeights");

const STATION_ID = 60003760;
const OFFSET_TOP = 320;
const theme = createTheme();

const collection = buildAssetNodes([
  {
    item_id: 5001,
    type_id: 34,
    quantity: 1,
    location_flag: "Hangar",
    location_id: STATION_ID,
    location_type: "station",
  },
]);

function renderTree() {
  const rows = assetRowsByLocation(collection).get(STATION_ID);

  return render(
    <ThemeProvider theme={theme}>
      <AssetTree
        locations={[{ locationId: STATION_ID, name: "Jita IV-4", rows }]}
        byItemId={collection.byItemId}
        fullItemList={{ 34: { name: "Tritanium" } }}
        containerNames={new Map()}
        expanded={new Set()}
        onToggle={() => {}}
      />
    </ThemeProvider>,
  );
}

/** The latest options the virtualiser was configured with. */
function lastOptions() {
  return calls[calls.length - 1];
}

let restoreMeasurements;

/** jsdom lays nothing out, so where the list sits has to be stated. */
function listSitsAt(top) {
  restoreMeasurements?.();
  restoreMeasurements = stubElementHeights(40, 1024, top);
}

beforeEach(() => {
  calls.length = 0;
  listSitsAt(OFFSET_TOP);
});

afterEach(() => {
  restoreMeasurements?.();
  restoreMeasurements = null;
});

describe("where the asset tree tells the virtualiser it starts", () => {
  // The window virtualiser measures scroll against the whole page, so it needs
  // the distance from the top of the page down to the list. Told zero, it
  // believes the list starts at the top of the document and mounts the rows
  // for a part of the tree the reader is not looking at.
  it("has the list's own offset by the time it has mounted", () => {
    renderTree();

    expect(lastOptions().scrollMargin).toBe(OFFSET_TOP);
  });

  it("keeps it across a re-render", () => {
    const { rerender } = renderTree();

    rerender(
      <ThemeProvider theme={theme}>
        <AssetTree
          locations={[
            {
              locationId: STATION_ID,
              name: "Jita IV-4",
              rows: assetRowsByLocation(collection).get(STATION_ID),
            },
          ]}
          byItemId={collection.byItemId}
          fullItemList={{ 34: { name: "Tritanium" } }}
          containerNames={new Map()}
          expanded={new Set()}
          onToggle={() => {}}
        />
      </ThemeProvider>,
    );

    expect(lastOptions().scrollMargin).toBe(OFFSET_TOP);
  });

  it("follows the list when it moves down the page", () => {
    const { rerender } = renderTree();
    expect(lastOptions().scrollMargin).toBe(OFFSET_TOP);

    listSitsAt(OFFSET_TOP + 200);
    rerender(
      <ThemeProvider theme={theme}>
        <AssetTree
          locations={[
            {
              locationId: STATION_ID,
              name: "Jita IV-4",
              rows: assetRowsByLocation(collection).get(STATION_ID),
            },
          ]}
          byItemId={collection.byItemId}
          fullItemList={{ 34: { name: "Tritanium" } }}
          containerNames={new Map()}
          expanded={new Set()}
          onToggle={() => {}}
        />
      </ThemeProvider>,
    );

    expect(lastOptions().scrollMargin).toBe(OFFSET_TOP + 200);
  });
});
