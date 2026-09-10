import { useCallback, useState } from "react";

/**
 * The rows a view has open, owned by the view rather than by each row.
 *
 * @returns {{expanded: Set<string>, toggle: (key: string) => void}}
 */
export default function useExpandedRows() {
  const [expanded, setExpanded] = useState(() => new Set());

  const toggle = useCallback((key) => {
    setExpanded((held) => {
      const next = new Set(held);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  }, []);

  return { expanded, toggle };
}
