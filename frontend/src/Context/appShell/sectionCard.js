import { alpha } from "@mui/material/styles";

/**
 * `sx` for section cards (onboarding / settings shells): soft bordered paper with tinted fill.
 */
export const appShellSetupSectionPaperSx = {
  p: { xs: 2, md: 2.5 },
  borderRadius: 3,
  borderColor: (theme) => alpha(theme.palette.primary.main, 0.2),
  backgroundColor: (theme) =>
    alpha(
      theme.palette.background.paper,
      theme.palette.mode === "dark" ? 0.72 : 0.9,
    ),
  backdropFilter: "blur(3px)",
};

/**
 * `sx` for a card nested inside a section — a choice, an account, a preview.
 *
 * Quieter than the section it sits in: a smaller radius and a softer border, so
 * a card reads as content rather than as a second panel.
 */
export const appShellNestedCardSx = {
  p: 1.5,
  borderRadius: 2,
  borderColor: (theme) => alpha(theme.palette.primary.main, 0.16),
  backgroundColor: (theme) =>
    alpha(
      theme.palette.background.paper,
      theme.palette.mode === "dark" ? 0.5 : 0.88,
    ),
};
