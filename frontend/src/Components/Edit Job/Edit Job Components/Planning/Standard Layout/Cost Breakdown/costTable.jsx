import {
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from "@mui/material";

import {
  BandCaption,
  FIGURE_TONE,
  Figure,
  totalRowSx,
} from "../../../../../../Styled Components/Typography/figures";
import { ColumnHeaderRow } from "../../../../../../Styled Components/Table/tableParts";

/**
 * What the cost is made of, one line per part.
 *
 * The block this replaces printed both pricing models side by side and marked
 * neither as the one in effect. This states one set of figures, and each line
 * says in words what its figure is made of, because a number alone does not say
 * how much of the build it covers.
 */

const COLUMNS = [
  { id: "component", label: "Component", align: "left" },
  { id: "total", label: "Total", align: "right" },
  { id: "perUnit", label: "Per unit", align: "right" },
];

/**
 * @param {object} props
 * @param {import("../../../../../../Functions/MarketData/costBreakdown").CostBreakdown} props.cost
 * @param {(value: number) => string} props.formatIsk
 */
export default function CostTable({ cost, formatIsk }) {
  // Per unit comes from the figures rather than being divided again here: two
  // divisions of the same numbers is how two totals that disagree begin.
  const perUnit = (value) => (value === null ? null : formatIsk(value));

  return (
    <Table size="small" aria-label="Cost breakdown">
      <ColumnHeaderRow columns={COLUMNS} />
      <TableBody>
        {cost.toBuild.lines.map((line) => (
          <CostRow key={line.id} line={line} formatIsk={formatIsk} perUnit={perUnit} />
        ))}
        <SubtotalRow
          label="Cost to build"
          value={cost.toBuild.total}
          valuePerUnit={cost.toBuild.perUnit}
          formatIsk={formatIsk}
          perUnit={perUnit}
        />

        {cost.toSell.lines.length > 0 ? (
          <>
            <BandRow label="Cost to sell — estimated, if you list it" />
            {cost.toSell.lines.map((line) => (
              <CostRow
                key={line.id}
                line={line}
                formatIsk={formatIsk}
                perUnit={perUnit}
              />
            ))}
            <SubtotalRow
              label="Cost to build and sell"
              value={cost.total}
              valuePerUnit={cost.perUnit}
              formatIsk={formatIsk}
              perUnit={perUnit}
            />
          </>
        ) : null}
      </TableBody>
    </Table>
  );
}

/**
 * @param {object} props
 */
function CostRow({ line, formatIsk, perUnit }) {
  return (
    <TableRow>
      <TableCell>
        <Typography variant="body2">{line.label}</Typography>
        {line.detail ? (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
            {line.detail}
          </Typography>
        ) : null}
      </TableCell>
      <TableCell align="right">
        <Figure>{formatIsk(line.value)}</Figure>
      </TableCell>
      <TableCell align="right">
        <Figure>{perUnit(line.perUnit)}</Figure>
      </TableCell>
    </TableRow>
  );
}

/**
 * Closes a band, drawn the way every total in the app is.
 *
 * @param {object} props
 */
function SubtotalRow({ label, value, valuePerUnit, formatIsk, perUnit }) {
  return (
    <TableRow>
      <TableCell sx={totalRowSx}>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {label}
        </Typography>
      </TableCell>
      <TableCell align="right" sx={totalRowSx}>
        <Figure sx={{ fontWeight: 500 }}>{formatIsk(value)}</Figure>
      </TableCell>
      <TableCell align="right" sx={totalRowSx}>
        <Figure sx={{ fontWeight: 500 }}>{perUnit(valuePerUnit)}</Figure>
      </TableCell>
    </TableRow>
  );
}

/**
 * Puts a band caption in a table row. The caption itself is table-free, so a
 * panel stacking rows rather than tabulating them uses the same one.
 *
 * @param {object} props
 */
function BandRow({ label }) {
  return (
    <TableRow>
      <TableCell colSpan={COLUMNS.length} sx={{ borderBottom: 0, pt: 2 }}>
        <BandCaption tone={FIGURE_TONE.WARN}>{label}</BandCaption>
      </TableCell>
    </TableRow>
  );
}
