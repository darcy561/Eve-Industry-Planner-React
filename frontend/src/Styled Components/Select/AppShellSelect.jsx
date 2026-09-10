import { FormControl, FormHelperText, Select } from "@mui/material";
import { useTheme } from "@mui/material/styles";

import {
  appShellHelperTextSx,
  appShellOutlinedFormControl,
  getAppShellSelectMenuProps,
} from "../../Context/appShell";

/**
 * The dropdown of the app-shell design.
 *
 * Every panel offering a choice was assembling the same four pieces — an outlined `FormControl`
 * carrying the app-shell tokens, a `Select` given the shell's menu props, an optional helper line,
 * and a width. A panel now says what it is choosing between; how a dropdown looks is decided here.
 *
 * @param {Object} props
 * @param {*} props.value
 * @param {(value: *) => void} props.onChange - receives the value, not the event
 * @param {React.ReactNode} props.children - `MenuItem`s
 * @param {string} [props.helperText] - the line under the control
 * @param {number|Object} [props.minWidth]
 * @param {boolean} [props.fullWidth]
 * @param {Object} [props.formControlSx]
 * Remaining props are forwarded to the `Select`.
 */
export default function AppShellSelect({
  value,
  onChange,
  children,
  helperText,
  minWidth,
  fullWidth = false,
  formControlSx,
  ...selectProps
}) {
  const theme = useTheme();

  return (
    <FormControl
      size="small"
      fullWidth={fullWidth}
      sx={[
        (t) => ({ ...appShellOutlinedFormControl(t) }),
        minWidth ? { minWidth } : false,
        formControlSx,
      ]}
    >
      <Select
        value={value}
        size="small"
        onChange={(event) => onChange?.(event.target.value)}
        MenuProps={getAppShellSelectMenuProps(theme)}
        {...selectProps}
      >
        {children}
      </Select>
      {helperText ? (
        // The form-control token styles the input alone and never reaches the helper line, so the
        // shell applies it here rather than leaving each call site to remember.
        <FormHelperText variant="standard" sx={appShellHelperTextSx}>
          {helperText}
        </FormHelperText>
      ) : null}
    </FormControl>
  );
}
