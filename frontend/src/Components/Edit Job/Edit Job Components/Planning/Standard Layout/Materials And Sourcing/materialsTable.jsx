import {
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import {
  MATERIAL_PLAN,
  hasSavingAvailable,
} from "../../../../../../Functions/MarketData/materialSourcingRow";

/**
 * The material list, rendered once for the stage.
 *
 * A real table rather than the Grid rows it replaces: this is tabular data with
 * column headers, and the semantics are what let a screen reader announce which
 * figure belongs to which column.
 */

const COLUMNS = [
  { id: "material", label: "Material", align: "left" },
  { id: "qty", label: "Qty", align: "right" },
  { id: "buy", label: "Buy", align: "right" },
  { id: "build", label: "Build", align: "right" },
  { id: "delta", label: "Δ", align: "right" },
  { id: "plan", label: "Plan", align: "right" },
];

/**
 * @param {object} props
 * @param {import("../../../../../../Functions/MarketData/materialSourcingRow").MaterialSourcingRow[]} props.rows
 * @param {(value: number) => string} props.formatIsk
 * @param {(value: number) => string} props.formatQuantity
 * @param {(typeID: number) => void} [props.onToggleRow] - Opens the row's drawer
 * @param {number[]} [props.openTypeIDs] - Rows currently expanded
 */
export default function MaterialsTable({
  rows = [],
  formatIsk,
  formatQuantity,
  onToggleRow,
  openTypeIDs = [],
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
      <TableHead>
        <TableRow>
          {COLUMNS.map((column) => (
            <TableCell
              key={column.id}
              align={column.align}
              sx={{
                color: "text.secondary",
                fontSize: 11,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              {column.label}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row) => (
          <MaterialRow
            key={row.typeID}
            row={row}
            formatIsk={formatIsk}
            formatQuantity={formatQuantity}
            isOpen={open.has(row.typeID)}
            onToggleRow={onToggleRow}
          />
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
  const expandable = row.buildPrice !== null || row.isLinked;

  return (
    <TableRow
      hover={expandable}
      selected={isOpen}
      onClick={expandable ? () => onToggleRow?.(row.typeID) : undefined}
      sx={{
        cursor: expandable ? "pointer" : "default",
        // The stripe says the row needs a second look: it is building, or it
        // could be building for less than it is being bought for.
        "& td:first-of-type": accentStripe(building, saving),
      }}
    >
      <TableCell>{row.name}</TableCell>
      <TableCell align="right">
        <Figure>{formatQuantity(row.quantity)}</Figure>
      </TableCell>
      <TableCell align="right">
        <Figure cheapest={row.delta !== null && row.delta > 0}>
          {row.buyPrice === null ? null : formatIsk(row.buyPrice)}
        </Figure>
      </TableCell>
      <TableCell align="right">
        <Figure cheapest={row.delta !== null && row.delta < 0}>
          {row.buildPrice === null ? null : formatIsk(row.buildPrice)}
        </Figure>
      </TableCell>
      <TableCell align="right">
        <DeltaFigure delta={row.delta} />
      </TableCell>
      <TableCell align="right">
        <PlanCell plan={row.plan} saving={saving} />
      </TableCell>
    </TableRow>
  );
}

/**
 * A figure, or an em dash where there is none to give. Tabular numerals so the
 * columns line up down the page.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {boolean} [props.cheapest] - Marks the lower of the two prices
 */
function Figure({ children, cheapest = false }) {
  if (children === null || children === undefined) {
    return (
      <Typography component="span" variant="body2" color="text.disabled">
        —
      </Typography>
    );
  }

  return (
    <Typography
      component="span"
      variant="body2"
      sx={{
        fontVariantNumeric: "tabular-nums",
        color: cheapest ? "success.main" : "inherit",
      }}
    >
      {children}
    </Typography>
  );
}

/**
 * @param {object} props
 * @param {number|null} props.delta
 */
function DeltaFigure({ delta }) {
  if (delta === null) return <Figure>{null}</Figure>;

  const cheaper = delta < 0;
  return (
    <Typography
      component="span"
      variant="body2"
      sx={{
        fontVariantNumeric: "tabular-nums",
        color: cheaper ? "success.main" : "error.main",
      }}
    >
      {cheaper ? "−" : "+"}
      {Math.abs(delta * 100).toFixed(1)}%
    </Typography>
  );
}

/**
 * @param {object} props
 * @param {string} props.plan
 * @param {boolean} props.saving
 */
function PlanCell({ plan, saving }) {
  if (plan === MATERIAL_PLAN.BASE) {
    return (
      <Typography component="span" variant="caption" color="text.secondary">
        base
      </Typography>
    );
  }

  const { label, color, variant } = planChip(plan, saving);
  return <Chip size="small" label={label} color={color} variant={variant} />;
}

/**
 * @param {string} plan
 * @param {boolean} saving
 */
function planChip(plan, saving) {
  if (plan === MATERIAL_PLAN.PAID) {
    return { label: "Paid", color: "primary", variant: "outlined" };
  }
  if (plan === MATERIAL_PLAN.BUILD) {
    return { label: "Build", color: "success", variant: "outlined" };
  }
  // Buying while building would cost less: the chip carries the warning rather
  // than a separate marker, so the row says it in one place.
  return {
    label: "Buy",
    color: saving ? "warning" : "default",
    variant: "outlined",
  };
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

export { MaterialRow };
