import { describe, expect, it } from "vitest";
import buildBlueprintRows from "./buildBlueprintRows";
import { OWNER_KIND } from "../Shared/ownerKind";
import { jobTypes } from "../../Context/defaultValues";
import {
  blueprintSearchIndex,
  CAPACITOR_BLUEPRINT_TYPE_ID,
  CHARACTER_HASH,
  characterBlueprintRows,
  CORPORATION_ID,
  corporationBlueprintRows,
  POLYMER_TYPE_ID,
  reactionFormulaStackRow,
  RIFTER_BLUEPRINT_TYPE_ID,
  RIFTER_TYPE_ID,
  UNINDEXED_BLUEPRINT_TYPE_ID,
} from "../../tests/blueprintFixtures";

function build(rows = characterBlueprintRows) {
  return buildBlueprintRows(rows, blueprintSearchIndex);
}

describe("buildBlueprintRows", () => {
  it("returns an empty collection for no rows", () => {
    const { rows, byItemId, byTypeId } = buildBlueprintRows();

    expect(rows).toEqual([]);
    expect(byItemId.size).toBe(0);
    expect(byTypeId.size).toBe(0);
  });

  it("resolves what a blueprint builds and how", () => {
    const collection = build();

    expect(collection.byItemId.get(7001)).toMatchObject({
      productTypeId: RIFTER_TYPE_ID,
      jobType: jobTypes.manufacturing,
    });
    expect(collection.byItemId.get(7004)).toMatchObject({
      productTypeId: POLYMER_TYPE_ID,
      jobType: jobTypes.reaction,
    });
  });

  it("leaves the product unknown when the search index does not carry it", () => {
    const collection = build();

    expect(collection.byItemId.get(7006)).toMatchObject({
      typeId: UNINDEXED_BLUEPRINT_TYPE_ID,
      productTypeId: null,
      jobType: null,
    });
  });

  it("tolerates a missing search index", () => {
    const { rows } = buildBlueprintRows(characterBlueprintRows);

    expect(rows).toHaveLength(characterBlueprintRows.length);
    expect(rows.every((row) => row.productTypeId === null)).toBe(true);
  });

  it("decides isCopy once from ESI's quantity", () => {
    const collection = build();

    expect(collection.byItemId.get(7003).isCopy).toBe(true);
    expect(collection.byItemId.get(7001).isCopy).toBe(false);
    // A positive quantity is a stack of originals, not a copy.
    expect(collection.byItemId.get(7005).isCopy).toBe(false);
  });

  it("counts a market stack as the originals it holds", () => {
    const collection = build();

    expect(collection.byItemId.get(7005)).toMatchObject({
      quantity: 5,
      originalCount: 5,
    });
    expect(collection.byItemId.get(7001).originalCount).toBe(1);
    expect(collection.byItemId.get(7003).originalCount).toBe(0);
  });

  it("counts a stack of reaction formulas as the jobs it can run", () => {
    // Formulas restack after every use, so a stacked quantity is ordinary rather than a sign the
    // stack is untouched — a count of rows would report one job where four can run.
    const collection = build([reactionFormulaStackRow]);
    const formula = collection.byItemId.get(7010);

    expect(formula).toMatchObject({
      quantity: 4,
      originalCount: 4,
      isCopy: false,
      runs: -1,
      me: 0,
      te: 0,
      jobType: jobTypes.reaction,
    });
  });

  it("answers an owned-original count as a sum over rows", () => {
    const { byTypeId } = build();

    const capacitorOriginals = byTypeId
      .get(CAPACITOR_BLUEPRINT_TYPE_ID)
      .reduce((total, row) => total + row.originalCount, 0);

    expect(capacitorOriginals).toBe(5);
  });

  it("stamps a character owner from the character hash", () => {
    const collection = build();

    expect(collection.byItemId.get(7001)).toMatchObject({
      ownerType: OWNER_KIND.CHARACTER,
      ownerId: CHARACTER_HASH,
    });
  });

  it("stamps a corporation owner from the corporation id", () => {
    const collection = build(corporationBlueprintRows);

    expect(collection.byItemId.get(8001)).toMatchObject({
      ownerType: OWNER_KIND.CORPORATION,
      ownerId: CORPORATION_ID,
    });
  });

  it("keeps the raw holder rather than guessing at a place", () => {
    const collection = build();

    // 7003 sits in a container; only the asset collection can say where that container is.
    expect(collection.byItemId.get(7003)).toMatchObject({
      locationId: 7900,
      flag: "Unlocked",
    });
  });

  it("groups by type with originals first, most researched leading", () => {
    const { byTypeId } = build();

    expect(byTypeId.get(RIFTER_BLUEPRINT_TYPE_ID).map((row) => row.itemId)).toEqual(
      [7002, 7001, 7003]
    );
  });

  it("answers a library filter as an equality check", () => {
    const { rows } = buildBlueprintRows(
      [...characterBlueprintRows, ...corporationBlueprintRows],
      blueprintSearchIndex
    );

    const reactions = rows
      .filter((row) => row.jobType === jobTypes.reaction)
      .map((row) => row.itemId);

    expect(reactions).toEqual([7004, 8002]);
  });

  it("answers the owned and producible sets in one pass each", () => {
    const { rows } = build();

    const owned = new Set(rows.map((row) => row.typeId));
    const producible = new Set(
      rows.map((row) => row.productTypeId).filter((id) => id !== null)
    );

    expect(owned.has(RIFTER_BLUEPRINT_TYPE_ID)).toBe(true);
    expect(producible.has(RIFTER_TYPE_ID)).toBe(true);
    expect(producible.has(null)).toBe(false);
  });

  it("does not hide a corporation list fetched more than once", () => {
    const { rows } = buildBlueprintRows(
      [...corporationBlueprintRows, ...corporationBlueprintRows],
      blueprintSearchIndex
    );

    // Deduplicating here would leave the duplicate fetches in place and unnoticed.
    expect(rows).toHaveLength(corporationBlueprintRows.length * 2);
  });

  it("ignores rows without an item id", () => {
    const { rows } = buildBlueprintRows(
      [null, { type_id: RIFTER_BLUEPRINT_TYPE_ID }, ...characterBlueprintRows],
      blueprintSearchIndex
    );

    expect(rows).toHaveLength(characterBlueprintRows.length);
  });
});
