import { describe, expect, it } from "vitest";
import { readFileSync, globSync } from "node:fs";
import { createElement } from "react";
import { render } from "@testing-library/react";
import { unstable_defaultSxConfig as styleConfig } from "@mui/system/styleFunctionSx";
import * as MUI from "@mui/material";
import * as MUILab from "@mui/lab";

/**
 * MUI's components stopped taking style as props; it belongs in `sx`.
 *
 * A style passed as a prop fails in the one direction nothing catches: it is not
 * consumed, so it lands on the DOM node as an inert attribute and what it asked
 * for never happens. No error, no failing assertion — a caption that should be
 * on its own line simply runs into the text beside it.
 *
 * The `console.error` guard in setup.js catches this wherever a test renders the
 * component, but only 150 of the app's 398 components are ever rendered by one.
 * This reads all of them.
 *
 * Nothing below is a list of ours. Which names are styles comes from MUI's own
 * sx config; whether a given component takes one anyway is settled by rendering
 * it and looking. Both answers move when MUI moves.
 */
const STYLE_PROPS = new Set(Object.keys(styleConfig));
const COMPONENTS = { ...MUI, ...MUILab };

/** Which local name in a file refers to which MUI component. */
function muiImportsIn(source) {
  const names = new Map();
  const imports = source.matchAll(
    /import\s*\{([^}]+)\}\s*from\s*["']@mui\/(?:material|lab)["']/g,
  );

  for (const [, clause] of imports) {
    for (const entry of clause.split(",")) {
      const [imported, local] = entry.split(/\s+as\s+/).map((s) => s.trim());
      if (imported) names.set(local || imported, imported);
    }
  }
  return names;
}

/**
 * Whether MUI swallows this prop or hands it to the DOM.
 *
 * Some components forward what they do not recognise to an inner one that does —
 * `DialogTitle` passes `color` to the `Typography` it renders — so a component's
 * own propTypes do not settle it. Rendering does. A component that will not
 * render bare is reported rather than excused.
 */
const reachesTheDom = (() => {
  const seen = new Map();

  return (name, prop) => {
    const key = `${name}.${prop}`;
    if (seen.has(key)) return seen.get(key);

    let verdict;
    try {
      const { container, unmount } = render(
        createElement(
          COMPONENTS[name],
          { [prop]: "probe", "data-probe": "", children: "x" },
          undefined,
        ),
      );
      verdict = Boolean(
        container.querySelector(`[${prop.toLowerCase()}="probe"]`),
      );
      unmount();
    } catch {
      verdict = true;
    }

    seen.set(key, verdict);
    return verdict;
  };
})();

describe("style handed to MUI in a way it will honour", () => {
  it("passes style through sx rather than as props", () => {
    const offenders = [];

    for (const file of globSync("src/**/*.jsx")) {
      const source = readFileSync(file, "utf8");
      const imported = muiImportsIn(source);
      if (imported.size === 0) continue;

      for (const [, local, attrs] of source.matchAll(
        /<([A-Z][A-Za-z0-9]*)\b([^>]*?)\/?>/gs,
      )) {
        const name = imported.get(local);
        if (!COMPONENTS[name]) continue;

        const accepted = new Set(Object.keys(COMPONENTS[name].propTypes ?? {}));
        const passed = [
          ...attrs.matchAll(/(?:^|\s)([A-Za-z][A-Za-z0-9]*)\s*=/g),
        ]
          .map(([, prop]) => prop)
          .filter((prop) => STYLE_PROPS.has(prop) && !accepted.has(prop));

        const dropped = passed.filter((prop) => reachesTheDom(name, prop));
        if (dropped.length > 0) {
          offenders.push(`${file}  <${local} ${dropped.join(" ")}>`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  // The check is only as good as what it reads out of MUI, so it states what it
  // is relying on. A release that changes any of these should fail here rather
  // than quietly stop checking anything.
  it("takes its style names and its exceptions from MUI itself", () => {
    expect(STYLE_PROPS.has("alignItems")).toBe(true);
    expect(Object.keys(MUI.Stack.propTypes)).toContain("direction");
    expect(reachesTheDom("Stack", "alignItems")).toBe(true);
    expect(reachesTheDom("DialogTitle", "color")).toBe(false);
  });
});
