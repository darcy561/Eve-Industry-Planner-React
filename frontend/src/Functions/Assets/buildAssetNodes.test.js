import { describe, expect, it } from "vitest";
import buildAssetNodes from "./buildAssetNodes";
import { LOCATION_KIND } from "./assetLocationConstants";
import {
  ASSET_SAFETY_ID,
  characterAssetRows,
  corporationAssetRows,
  corporationOwnedStructureRows,
  cyclicAssetRows,
  inSpaceAssetRows,
  JITA_STATION_ID,
  OIJAMON_SYSTEM_ID,
  orphanedAssetRow,
  OWNED_STRUCTURE_ID,
  RAITARU_STRUCTURE_ID,
  selfHoldingAssetRow,
} from "../../tests/assetFixtures";

function nodeFor(collection, itemId) {
  return collection.byItemId.get(itemId);
}

describe("buildAssetNodes", () => {
  it("returns an empty collection for no rows", () => {
    const { nodes, byItemId } = buildAssetNodes();

    expect(nodes).toEqual([]);
    expect(byItemId.size).toBe(0);
  });

  it("treats a holder outside the set as the location", () => {
    const { nodes } = buildAssetNodes([orphanedAssetRow]);

    expect(nodes[0]).toMatchObject({
      parentId: null,
      locationId: 999999,
      depth: 0,
      rootFlag: "Unlocked",
      locationKind: "structure",
    });
  });

  it("places a stack sitting directly at a station", () => {
    const collection = buildAssetNodes(characterAssetRows);

    expect(nodeFor(collection, 1001)).toMatchObject({
      parentId: null,
      childIds: [],
      locationId: JITA_STATION_ID,
      locationKind: "station",
      rootFlag: "Hangar",
      depth: 0,
    });
  });

  it("links a container to its contents", () => {
    const collection = buildAssetNodes(characterAssetRows);

    expect(nodeFor(collection, 1002).childIds).toEqual([1003, 1004]);
    expect(nodeFor(collection, 1003).parentId).toBe(1002);
  });

  it("orders children by type then item id", () => {
    const collection = buildAssetNodes(characterAssetRows);

    // 1003 is type 35 and 1004 is type 3465, so the lower type leads regardless of input order.
    expect(nodeFor(collection, 1002).childIds).toEqual([1003, 1004]);
  });

  it("resolves a nested container's contents to the station", () => {
    const collection = buildAssetNodes(characterAssetRows);

    expect(nodeFor(collection, 1005)).toMatchObject({
      parentId: 1004,
      locationId: JITA_STATION_ID,
      locationKind: "station",
      rootFlag: "Hangar",
      depth: 2,
    });
  });

  it("carries the Deliveries compartment down into a container", () => {
    const collection = buildAssetNodes(characterAssetRows);

    // The row itself carries location_flag "Unlocked"; the compartment comes from its ancestor.
    expect(nodeFor(collection, 1008).flag).toBe("Unlocked");
    expect(nodeFor(collection, 1008).rootFlag).toBe("Deliveries");
  });

  it("answers a compartment view as an equality check", () => {
    const { nodes } = buildAssetNodes(characterAssetRows);

    const deliveries = nodes
      .filter((node) => node.rootFlag === "Deliveries")
      .map((node) => node.itemId);

    expect(deliveries).toEqual([1006, 1007, 1008]);
  });

  it("reads asset safety as its own location rather than a place", () => {
    const collection = buildAssetNodes(characterAssetRows);

    expect(nodeFor(collection, 1009)).toMatchObject({
      locationId: ASSET_SAFETY_ID,
      locationKind: "assetSafety",
      rootFlag: "AssetSafety",
      depth: 0,
    });
  });

  it("classifies a player structure by its id range, not its location_type", () => {
    const collection = buildAssetNodes(characterAssetRows);
    const node = nodeFor(collection, 1011);

    // ESI reports location_type "item" here, the same value a container carries.
    expect(node.locationId).toBe(RAITARU_STRUCTURE_ID);
    expect(node.locationKind).toBe("structure");
    expect(node.parentId).toBeNull();
  });

  it("keeps a module fitted to a ship that is in space", () => {
    const collection = buildAssetNodes(characterAssetRows);

    expect(nodeFor(collection, 1010)).toMatchObject({
      parentId: null,
      locationId: 1099999999999,
      rootFlag: "LoSlot0",
      depth: 0,
    });
  });

  // The ship's own item id sits in the same range a structure's does, so the id alone reads as a
  // place. Asked of ESI as one, it is refused for every character every time — and a refusal costs
  // five times what an answer does against the error budget.
  it("calls the ship holding it a ship rather than a structure", () => {
    const collection = buildAssetNodes(characterAssetRows);

    expect(nodeFor(collection, 1010).locationKind).toBe(LOCATION_KIND.SHIP);
  });

  // A hauler with nothing fitted is still a ship: its hold says so where a slot would have.
  it("calls a ship carrying only cargo a ship", () => {
    const collection = buildAssetNodes([
      {
        item_id: 5001,
        type_id: 34,
        quantity: 500,
        location_flag: "Cargo",
        location_id: 1099999999998,
        location_type: "item",
      },
    ]);

    expect(nodeFor(collection, 5001).locationKind).toBe(LOCATION_KIND.SHIP);
  });

  // Our own items sitting in someone else's structure carry the same flag a hangar always does, and
  // that structure has a name the account can read. Calling it a ship would lose it.
  it("still calls a hangar in an unseen structure a structure", () => {
    const collection = buildAssetNodes([
      {
        item_id: 5002,
        type_id: 34,
        quantity: 10,
        location_flag: "Hangar",
        location_id: 1035466617946,
        location_type: "item",
      },
    ]);

    expect(nodeFor(collection, 5002).locationKind).toBe(
      LOCATION_KIND.STRUCTURE,
    );
  });

  // The same id range, told apart only by what the thing inside it is filed in.
  it("still calls a structure a structure", () => {
    const collection = buildAssetNodes(characterAssetRows);

    expect(nodeFor(collection, 1011).locationKind).toBe(
      LOCATION_KIND.STRUCTURE,
    );
  });

  it("reads an office folder's divisions as the compartment", () => {
    const collection = buildAssetNodes(corporationAssetRows);

    expect(nodeFor(collection, 2002)).toMatchObject({
      locationId: JITA_STATION_ID,
      rootFlag: "CorpSAG3",
      depth: 1,
    });
    expect(nodeFor(collection, 2004)).toMatchObject({
      locationId: JITA_STATION_ID,
      rootFlag: "CorpSAG1",
      depth: 1,
    });
  });

  it("carries a hangar division into a crate inside it", () => {
    const collection = buildAssetNodes(corporationAssetRows);

    expect(nodeFor(collection, 2003)).toMatchObject({
      parentId: 2002,
      locationId: JITA_STATION_ID,
      rootFlag: "CorpSAG3",
      depth: 2,
    });
  });

  it("answers an office hangar as one equality pair", () => {
    const { nodes } = buildAssetNodes(corporationAssetRows);

    const hangarThree = nodes
      .filter(
        (node) =>
          node.locationId === JITA_STATION_ID && node.rootFlag === "CorpSAG3",
      )
      .map((node) => node.itemId);

    expect(hangarThree).toEqual([2002, 2003]);
  });

  it("keeps one node per item when members' views overlap", () => {
    const { nodes } = buildAssetNodes([
      ...corporationAssetRows,
      ...corporationAssetRows,
    ]);

    expect(nodes).toHaveLength(corporationAssetRows.length);
    expect(nodes.filter((node) => node.itemId === 2002)).toHaveLength(1);
    expect(nodes.find((node) => node.itemId === 2001).childIds).toEqual([
      2004, 2002,
    ]);
  });

  it("classifies a system by range whether it is New Eden or a wormhole", () => {
    const collection = buildAssetNodes(inSpaceAssetRows);

    expect(nodeFor(collection, 5001).locationKind).toBe("system");
    expect(nodeFor(collection, 5002).locationKind).toBe("abyssalSystem");
  });

  it("does not make a self-holding row its own parent", () => {
    const { nodes } = buildAssetNodes([selfHoldingAssetRow]);

    expect(nodes[0]).toMatchObject({
      parentId: null,
      childIds: [],
      depth: 0,
    });
  });

  it("keeps a well-formed row that hangs beneath a cycle attached to its holder", () => {
    const collection = buildAssetNodes(cyclicAssetRows);
    const attached = nodeFor(collection, 4003);

    expect(attached.parentId).toBe(4001);
    expect(nodeFor(collection, 4001).childIds).toContain(4003);
    expect(attached.depth).toBeGreaterThan(0);
  });

  it("resolves a cycle the same way whichever row comes first", () => {
    const forwards = buildAssetNodes(cyclicAssetRows);
    const backwards = buildAssetNodes([...cyclicAssetRows].reverse());

    const shape = (collection) =>
      [...collection.byItemId.values()]
        .map(({ itemId, parentId, depth }) => ({ itemId, parentId, depth }))
        .sort((a, b) => a.itemId - b.itemId);

    expect(shape(backwards)).toEqual(shape(forwards));
  });

  it("terminates on a cyclic chain and leaves it walkable", () => {
    const collection = buildAssetNodes(cyclicAssetRows);

    expect(collection.nodes).toHaveLength(3);

    for (const node of collection.nodes) {
      let steps = 0;
      let current = node;
      while (current.parentId !== null) {
        current = collection.byItemId.get(current.parentId);
        steps += 1;
        expect(steps).toBeLessThan(collection.nodes.length + 1);
      }
    }
  });

  it("ignores rows without an item id", () => {
    const { nodes } = buildAssetNodes([
      null,
      { type_id: 34 },
      ...characterAssetRows,
    ]);

    expect(nodes).toHaveLength(characterAssetRows.length);
  });
});

// A corporation owns the structures it built, so the structure is one of its own asset rows and the
// chain would otherwise walk through it to the system it sits in.
describe("a corporation's own structure", () => {
  const { byItemId } = buildAssetNodes(corporationOwnedStructureRows);

  it("holds the office at the structure rather than in space", () => {
    expect(byItemId.get(2101).locationId).toBe(OWNED_STRUCTURE_ID);
    expect(byItemId.get(2101).parentId).toBe(null);
  });

  it("holds what is in the office there too", () => {
    expect(byItemId.get(2102).locationId).toBe(OWNED_STRUCTURE_ID);
    expect(byItemId.get(2102).rootFlag).toBe("CorpSAG1");
  });

  it("holds a stack in the structure's hangar at the structure", () => {
    expect(byItemId.get(2103).locationId).toBe(OWNED_STRUCTURE_ID);
    expect(byItemId.get(2103).parentId).toBe(null);
  });

  it("leaves the structure itself in the system", () => {
    expect(byItemId.get(OWNED_STRUCTURE_ID).locationId).toBe(OIJAMON_SYSTEM_ID);
  });
});
