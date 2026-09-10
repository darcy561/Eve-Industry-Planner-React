import { Avatar } from "@mui/material";

import { ownerImageUrl, ownerName } from "../../Functions/Shared/eveOwner";

/**
 * Whoever holds a thing, as EVE's own portrait or corporation logo.
 *
 * @param {{owner: import("../../Functions/Shared/eveOwner").EveOwner|null, size?: number}} props
 */
export default function OwnerAvatar({ owner, size = 24, ...rest }) {
  const name = ownerName(owner);

  return (
    <Avatar
      src={ownerImageUrl(owner, size * 2)}
      alt={name}
      title={name || undefined}
      variant="circular"
      sx={{ height: size, width: size }}
      {...rest}
    />
  );
}
