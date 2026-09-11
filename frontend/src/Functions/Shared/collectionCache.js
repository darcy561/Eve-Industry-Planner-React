/**
 * Shares a derived collection across every component that asks for it.
 *
 * React Query keeps a query's `data` array referentially stable until a refetch replaces it, so
 * the source arrays are the natural cache key: the same sources mean the same derived value. The
 * cache is weak on the first source, so an entry is collected when its query data is replaced.
 *
 * Several scopes can share a first source — every character's assets and one character's assets
 * both start with the same array — so each first source holds a few entries rather than one.
 * Without that they evict each other on every render, and each consumer rebuilds its collection
 * every time the other renders.
 *
 * A `useMemo` cannot do this — it is per component instance, and several components asking for the
 * same scope would each build their own copy.
 *
 * @param {(sources: Array<Array<Object>>, extra: *) => *} build - derives the collection
 * @param {*} whenEmpty - returned when there are no sources, so callers get a stable value
 * @returns {(sources: Array<Array<Object>>, extra?: *) => *}
 */
export default function createCollectionCache(build, whenEmpty) {
  const cache = new WeakMap();

  return function derive(sources, extra) {
    if (!sources.length) return whenEmpty;

    const held = cache.get(sources[0]) ?? [];
    const match = held.find(
      (entry) =>
        entry.extra === extra &&
        entry.sources.length === sources.length &&
        entry.sources.every((source, index) => source === sources[index]),
    );
    if (match) return match.value;

    const value = build(sources, extra);
    // Oldest out first: a scope that stopped asking should not hold a place forever.
    cache.set(sources[0], [
      ...held.slice(-(MAX_ENTRIES_PER_SOURCE - 1)),
      { sources: [...sources], extra, value },
    ]);
    return value;
  };
}

/** Scopes that can share a first source: character, characters, corporation, all, and a spare. */
const MAX_ENTRIES_PER_SOURCE = 5;
