import { Button, CardActionArea, ListItemButton } from "@mui/material";
import { createLink } from "@tanstack/react-router";

/**
 * MUI controls that navigate as real links: `createLink` around a ButtonBase control,
 * rendering an `<a href>` the router handles on click. Route props (`to`, `params`,
 * `search`) go straight on them and every MUI prop still works.
 *
 * These are for a control whose only job is to go somewhere. Navigation that follows
 * other work — a save, a leave confirmation — stays with `useNavigate`, as does any
 * route whose `beforeLoad` has side effects, because the router preloads on intent.
 *
 * They are not natively draggable. Most of them sit inside a dnd-kit drag source, where
 * the browser would otherwise drag the anchor in place of the card holding it; pass
 * `draggable` to get the browser's own link dragging back.
 */
export const RouterButton = asRouterControl(Button);

export const RouterListItemButton = asRouterControl(ListItemButton);

export const RouterCardActionArea = asRouterControl(CardActionArea);

/**
 * Wraps a click handler so it runs only for clicks the router follows in this tab.
 *
 * A caller's `onClick` is composed ahead of the router's own and runs for every click,
 * including the modifier and middle clicks the router leaves to the browser — so a menu
 * dismissing itself on navigation closes behind a reader who never left the page.
 *
 * @param {(event: MouseEvent) => void} after
 * @returns {(event: MouseEvent) => void}
 */
export function whenFollowed(after) {
  return (event) => {
    const opensElsewhere =
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey;
    if (!opensElsewhere) after(event);
  };
}

function asRouterControl(Control) {
  const Linked = createLink(Control);

  /**
   * Disabled, the router drops the `href` but still forces `role="link"`, announcing a
   * dead control as a link — so a disabled one is the plain MUI control, with the route
   * props taken off it before they reach the DOM as unknown attributes.
   */
  return function RouterControl(props) {
    if (!props.disabled) return <Linked draggable={false} {...props} />;

    const { to, params, search, hash, from, preload, replace, ...rest } = props;
    return <Control {...rest} />;
  };
}
