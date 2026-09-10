/**
 * Shares a derived collection across every component that asks for it.
 *
 * React Query keeps a query's `data` array referentially stable until a refetch replaces it, so
 * the source arrays are the natural cache key: the same sources mean the same derived value. The
 * cache is weak on the first source, so an entry is collected when its query data is replaced.
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

    const held = cache.get(sources[0]);
    if (
      held &&
      held.extra === extra &&
      held.sources.length === sources.length &&
      held.sources.every((source, index) => source === sources[index])
    ) {
      return held.value;
    }

    const value = build(sources, extra);
    cache.set(sources[0], { sources: [...sources], extra, value });
    return value;
  };
}
