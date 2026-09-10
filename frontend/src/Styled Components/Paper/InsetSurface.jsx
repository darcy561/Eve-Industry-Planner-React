import { Box } from "@mui/material";

import { appShellInsetSurfaceSx } from "../../Context/appShell";

/**
 * A recessed area inside an app-shell panel — an expanded row, a rate block, a
 * disclosure.
 *
 * Wraps the sx the design already defines so a panel nests content by saying
 * what it is rather than by repeating a border, a radius and a mode-dependent
 * background.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {object} [props.sx]
 */
export default function InsetSurface({ children, sx, ...rest }) {
  return (
    <Box
      sx={[
        (theme) => ({ ...appShellInsetSurfaceSx(theme), p: 1.5 }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...rest}
    >
      {children}
    </Box>
  );
}
