import { Fragment } from "react";

import BlockIcon from "@mui/icons-material/Block";
import DoneIcon from "@mui/icons-material/Done";
import LensIcon from "@mui/icons-material/Lens";
import {
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";

import {
  FIGURE_TONE,
  Figure,
  SignedPercent,
} from "../../../../../../Styled Components/Typography/figures";
import { ColumnHeaderRow } from "../../../../../../Styled Components/Table/tableParts";
import MaterialPopoverIconButtons from "../../../../../../Styled Components/Popover/iconButtons";
import { getJobTypeAccentColour } from "../../../../../../Functions/Helper/jobTypeDividerColour";
import { eveImageSize } from "../../../../../../Functions/Shared/eveOwner";
import {
  getListingModeLabel,
  getMarketLocationLabel,
} from "./Helpers/marketLabelHelpers";
import { MATERIAL_MARK } from "../../../../../../Functions/MarketData/materialMark";
import StatusChip, {
  STATUS_TONE,
} from "../../../../../../Styled Components/Chip/statusChip";
import {
  MATERIAL_PLAN,
  hasSavingAvailable,
} from "../../../../../../Functions/MarketData/materialSourcingRow";
import ShortfallChip from "./shortfallChip";

/**
 * The material list, rendered once for the stage.
 *
 * A real table rather than a grid of boxes: this is tabular data with column
 * headers, and the semantics are what let a screen reader announce which figure
 * belongs to which column.
 */

const COLUMNS = [
  { id: "material", label: "Material", align: "left" },
  { id: "qty", label: "Qty", align: "right" },
  { id: "buy", label: "Buy", align: "right" },
  { id: "build", label: "Build", align: "right" },
  { id: "delta", label: "Δ", align: "right" },
  { id: "source", label: "Source", align: "right" },
  { id: "plan", label: "Plan", align: "right" },
];

/**
 * @param {object} props
 * @param {import("../../../../../../Functions/MarketData/materialSourcingRow").MaterialSourcingRow[]} props.rows
 * @param {(value: number) => string} props.formatIsk
 * @param {(value: number) => string} props.formatQuantity
 * @param {(typeID: number) => void} [props.onToggleRow] - Opens the row's drawer
 * @param {number[]} [props.openTypeIDs] - Rows currently expanded
 * @param {(row: object, isOpen: boolean) => React.ReactNode} [props.renderDrawer]
 *   What an opened row shows beneath itself
 */
export default function MaterialsTable({
  rows = [],
  formatIsk,
  formatQuantity,
  onToggleRow,
  openTypeIDs = [],
  renderDrawer,
}) {
  if (rows.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
        This setup needs no materials.
      </Typography>
    );
  }

  const open = new Set(openTypeIDs);

  return (
    <Table size="small" aria-label="Materials and sourcing">
      <ColumnHeaderRow columns={COLUMNS} />
      <TableBody>
        {rows.map((row) => (
          <Fragment key={row.typeID}>
            <MaterialRow
              row={row}
              formatIsk={formatIsk}
              formatQuantity={formatQuantity}
              isOpen={open.has(row.typeID)}
              onToggleRow={onToggleRow}
            />
            {renderDrawer ? (
              <TableRow>
                {/* The drawer belongs to its row, so it spans the table rather
                    than floating over it: more than one can be open, and each
                    stays with its row as the list scrolls. */}
                <TableCell colSpan={COLUMNS.length} sx={{ p: 0, border: 0 }}>
                  {renderDrawer(row, open.has(row.typeID))}
                </TableCell>
              </TableRow>
            ) : null}
          </Fragment>
        ))}
      </TableBody>
    </Table>
  );
}

/**
 * @param {object} props
 */
function MaterialRow({ row, formatIsk, formatQuantity, isOpen, onToggleRow }) {
  const building = row.plan === MATERIAL_PLAN.BUILD;
  const saving = hasSavingAvailable(row);
  // Anything with a blueprint opens, linked or not: opening a row that has
  // never been linked is how a first child job gets created.
  const expandable = row.isBuildable;

  return (
    <TableRow
      hover={expandable}
      selected={isOpen}
      onClick={expandable ? () => onToggleRow?.(row.typeID) : undefined}
      sx={{
        cursor: expandable ? "pointer" : "default",
        // The stripe says the row needs a second look: it is building, it could
        // be building for less than it is being bought for, or what builds it
        // no longer makes enough.
        "& td:first-of-type": accentStripe(
          building,
          saving || Boolean(row.coverage?.isShort),
        ),
      }}
    >
      <TableCell>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <MaterialMark mark={row.mark} />
          {/* The item's own artwork: a player picks a row out by its icon well
              before reading the name beside it. */}
          <Box
            component="img"
            src={`https://images.evetech.net/types/${row.typeID}/icon?size=${eveImageSize(22)}`}
            alt=""
            loading="lazy"
            sx={{ width: 22, height: 22, borderRadius: "3px", flexShrink: 0 }}
          />
          <MaterialPopoverIconButtons typeID={row.typeID}>
            <Typography variant="body2" component="span">
              {row.name}
            </Typography>
          </MaterialPopoverIconButtons>
        </Box>
      </TableCell>
      <TableCell align="right">
        <Figure>{formatQuantity(row.quantity)}</Figure>
      </TableCell>
      <TableCell align="right">
        <Figure tone={cheaperTone(row.delta !== null && row.delta > 0)}>
          {row.buyPrice === null ? null : formatIsk(row.buyPrice)}
        </Figure>
      </TableCell>
      <TableCell align="right">
        <Figure tone={cheaperTone(row.delta !== null && row.delta < 0)}>
          {row.buildPrice === null ? null : formatIsk(row.buildPrice)}
        </Figure>
      </TableCell>
      <TableCell align="right">
        <SignedPercent value={row.delta} />
      </TableCell>
      <TableCell align="right">
        <SourceCell row={row} />
      </TableCell>
      <TableCell align="right">
        <PlanCell
          plan={row.plan}
          saving={saving}
          coverage={row.coverage}
          childJobs={row.matchedChildJobs}
        />
      </TableCell>
    </TableRow>
  );
}

/**
 * What kind of material this is, and whether anything is building it.
 *
 * A tick where a child job is linked, a dot where none is, in the job type's
 * accent colour. Amber where something is pending against a material nothing is
 * linked to yet.
 *
 * A material the account excludes from builds is struck out and greyed instead.
 * Giving it amber too would say the same thing as pending, which is the opposite
 * meaning: pending wants a decision, exempt wants nothing. Both are legible
 * without hovering, which a tooltip alone is not.
 *
 * @param {object} props
 * @param {import("../../../../../../Functions/MarketData/materialMark").MaterialMark} [props.mark]
 */
function MaterialMark({ mark }) {
  const theme = useTheme();
  if (!mark) return null;

  const colour = mark.isExempt
    ? theme.palette.text.disabled
    : mark.isUnsettled
      ? theme.palette.warning.main
      : getJobTypeAccentColour(theme, mark.jobType);

  const Glyph = mark.isExempt
    ? BlockIcon
    : mark.kind === MATERIAL_MARK.PLAIN
      ? LensIcon
      : DoneIcon;

  return (
    <Tooltip title={mark.label} placement="left-start" arrow>
      <Box
        component="span"
        aria-label={mark.label}
        sx={{ display: "inline-flex", color: colour }}
      >
        <Glyph fontSize="small" />
      </Box>
    </Tooltip>
  );
}

/**
 * Marks the lower of a row's two prices, and nothing where there is only one.
 *
 * @param {boolean} isCheaper
 * @returns {string} One of FIGURE_TONE
 */
function cheaperTone(isCheaper) {
  return isCheaper ? FIGURE_TONE.GOOD : FIGURE_TONE.PLAIN;
}

/**
 * @param {object} props
 * @param {string} props.plan
 * @param {boolean} props.saving
 */
function PlanCell({ plan, saving, coverage, childJobs }) {
  const short = <ShortfallChip coverage={coverage} childJobs={childJobs} />;

  if (plan === MATERIAL_PLAN.BASE) {
    return (
      <Typography component="span" variant="caption" color="text.secondary">
        base
      </Typography>
    );
  }

  if (plan === MATERIAL_PLAN.PAID) {
    return <StatusChip label="Paid" tone={STATUS_TONE.FACT} />;
  }
  // The shortfall tag rides alongside whichever plan the row is on. A linked job
  // that has stopped producing has no build price, so its row reads as Buy — and
  // that is the row most in need of the tag rather than least.
  return (
    <Stack direction="row" spacing={0.5} justifyContent="flex-end" flexWrap="wrap">
      {plan === MATERIAL_PLAN.BUILD ? (
        <StatusChip label="Build" tone={STATUS_TONE.GOOD} />
      ) : (
        // Buying while building would cost less: the chip carries the warning
        // rather than a separate marker, so the row says it in one place.
        <StatusChip
          label="Buy"
          tone={saving ? STATUS_TONE.WARN : STATUS_TONE.NEUTRAL}
        />
      )}
      {short}
    </Stack>
  );
}

/**
 * @param {boolean} building
 * @param {boolean} saving
 */
function accentStripe(building, saving) {
  if (saving) return { boxShadow: (theme) => `inset 3px 0 0 ${theme.palette.warning.main}` };
  if (building) {
    return { boxShadow: (theme) => `inset 3px 0 0 ${theme.palette.success.main}` };
  }
  return {};
}

export { MaterialRow, MaterialMark, PlanCell, SourceCell, cheaperTone, accentStripe };

/**
 * Where the row's buy price came from: the hub, and which of the four figures
 * the server publishes for it.
 *
 * A row priced from a real purchase names Price Entry instead: there is no
 * market figure behind it, and repeating the plan chip's "Paid" would say the
 * same thing twice on one row.
 *
 * @param {object} props
 * @param {import("../../../../../../Functions/MarketData/materialSourcingRow").MaterialSourcingRow} props.row
 */
function SourceCell({ row }) {
  if (row.plan === MATERIAL_PLAN.PAID) {
    return (
      <Typography variant="caption" color="text.secondary">
        Price Entry
      </Typography>
    );
  }

  return (
    <Typography variant="caption" color="text.secondary" noWrap>
      {getMarketLocationLabel(row.marketSelect)} ·{" "}
      {getListingModeLabel(row.listingSelect)}
    </Typography>
  );
}
