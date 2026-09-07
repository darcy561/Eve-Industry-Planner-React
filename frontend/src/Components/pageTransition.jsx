import { Box, Fade } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";

/**
 * Key identifying the full-page view on screen.
 *
 * The route pattern, not the resolved path: changing a param (opening a child
 * job from an open one) updates the page in place rather than swapping it.
 *
 * @param {boolean} isMaintenanceMode
 * @returns {string}
 */
export function usePageKey(isMaintenanceMode) {
  const routeId = useRouterState({
    select: (state) => state.matches.at(-1)?.routeId ?? "",
  });
  return isMaintenanceMode ? "maintenance" : routeId;
}

/**
 * Fades full-page content in when `contentKey` changes.
 *
 * Only the incoming content is rendered — a page being left is unmounted at
 * once, so its effects and locks are released on navigation rather than being
 * held alive for the length of a fade.
 *
 * @param {Object} props
 * @param {string} props.contentKey Changing this restarts the fade.
 * @param {React.ReactNode} props.children
 * @param {import("@mui/material").SxProps} [props.sx]
 */
export default function PageTransition({ contentKey, children, sx }) {
  const theme = useTheme();
  const [faded, setFaded] = useState(contentKey);

  // Two frames, not one: the first lets the browser paint the hidden state, so
  // the fade has something to animate from even when the incoming page's mount
  // occupies the frame after the key changed.
  useEffect(() => {
    if (faded === contentKey) return;
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setFaded(contentKey));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [contentKey, faded]);

  return (
    <Fade
      in={faded === contentKey}
      timeout={theme.transitions.duration.enteringScreen}
      appear={false}
    >
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          // Row: pages place a side drawer beside their main content.
          flexDirection: "row",
          ...sx,
        }}
      >
        {children}
      </Box>
    </Fade>
  );
}
