import { Box } from "@mui/material";

/**
 * A figure a what-if would replace, struck through beside the one replacing it.
 *
 * Both stay on screen because the delta is the answer, and reading it off two
 * panels is not an answer.
 *
 * @param {object} props
 * @param {React.ReactNode} props.was - Today's figure
 * @param {React.ReactNode} props.is - The figure under the question
 * @param {boolean} props.changed
 */
export default function Superseded({ was, is, changed }) {
  if (!changed) return is;

  return (
    <>
      <Box
        component="span"
        sx={{ textDecoration: "line-through", opacity: 0.55, mr: 0.75 }}
      >
        {was}
      </Box>
      <Box component="span" sx={{ color: "primary.main" }}>
        {is}
      </Box>
    </>
  );
}
