import { Stack, Typography } from "@mui/material";

import AppShellPanel from "../../../Styled Components/Paper/AppShellPanel";

/**
 * A step's section, on the same panel every other app-shell surface uses.
 *
 * Onboarding drew its own panel before this, with a primary-coloured h6 title
 * where every other panel uses a quiet secondary caption — so the first screens
 * a player saw looked unlike the app they were being set up for.
 *
 * @param {object} props
 * @param {React.ReactNode} props.title
 * @param {React.ReactNode} [props.subtitle]
 * @param {React.ReactNode} props.children
 */
export function FirstLoginSetupSection({ title, subtitle, children }) {
  return (
    <AppShellPanel title={title} componentName="FirstLoginSetupSection">
      {/* A step passes several siblings as its children and expects them spaced;
          the panel's own content box does not space them. */}
      <Stack spacing={1.5}>
        {subtitle ? (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        ) : null}
        {children}
      </Stack>
    </AppShellPanel>
  );
}
