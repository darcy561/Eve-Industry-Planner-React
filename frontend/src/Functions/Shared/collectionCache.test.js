import { describe, expect, it, vi } from "vitest";
import createCollectionCache from "./collectionCache";

describe("createCollectionCache", () => {
  it("returns the empty value when there are no sources", () => {
    const empty = { rows: [] };
    const build = vi.fn();
    const derive = createCollectionCache(build, empty);

    expect(derive([])).toBe(empty);
    expect(build).not.toHaveBeenCalled();
  });

  it("builds once for the same sources", () => {
    const build = vi.fn((sources) => sources.flat());
    const derive = createCollectionCache(build, null);
    const rows = [{ item_id: 1 }];

    const first = derive([rows]);
    const second = derive([rows]);

    expect(second).toBe(first);
    expect(build).toHaveBeenCalledTimes(1);
  });

  it("rebuilds when a query replaces its data", () => {
    const build = vi.fn((sources) => sources.flat());
    const derive = createCollectionCache(build, null);

    derive([[{ item_id: 1 }]]);
    derive([[{ item_id: 1 }]]);

    expect(build).toHaveBeenCalledTimes(2);
  });

  it("rebuilds when a later source changes but the first does not", () => {
    const build = vi.fn((sources) => sources.flat());
    const derive = createCollectionCache(build, null);
    const first = [{ item_id: 1 }];
    const second = [{ item_id: 2 }];
    const replacement = [{ item_id: 3 }];

    const before = derive([first, second]);
    const after = derive([first, replacement]);

    expect(after).not.toBe(before);
    expect(build).toHaveBeenCalledTimes(2);
  });

  it("rebuilds when the source count changes", () => {
    const build = vi.fn((sources) => sources.flat());
    const derive = createCollectionCache(build, null);
    const first = [{ item_id: 1 }];
    const second = [{ item_id: 2 }];

    derive([first]);
    derive([first, second]);

    expect(build).toHaveBeenCalledTimes(2);
  });

  it("rebuilds when the extra dependency changes", () => {
    const build = vi.fn((sources, extra) => ({ sources, extra }));
    const derive = createCollectionCache(build, null);
    const rows = [{ item_id: 1 }];
    const indexA = [{ blueprintID: 1 }];
    const indexB = [{ blueprintID: 2 }];

    derive([rows], indexA);
    derive([rows], indexA);
    derive([rows], indexB);

    expect(build).toHaveBeenCalledTimes(2);
  });

  // The blueprint library asks for every scope while an asset page asks for one, and both lists
  // start with the same character's rows.
  it("holds an entry for each scope sharing a first source", () => {
    const builds = [];
    const derive = createCollectionCache((sources) => {
      builds.push(sources.length);
      return sources.flat();
    }, { rows: [] });
    const first = [{ id: 1 }];
    const second = [{ id: 2 }];

    derive([first]);
    derive([first, second]);
    expect(builds).toHaveLength(2);

    derive([first]);
    derive([first, second]);
    expect(builds).toHaveLength(2);
  });
});
