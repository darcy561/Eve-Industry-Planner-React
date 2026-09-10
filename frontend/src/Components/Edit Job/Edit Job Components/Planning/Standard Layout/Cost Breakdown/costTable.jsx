import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import {
  FIGURE_TONE,
  Figure,
  FigureCaption,
} from "../../../../../../Styled Components/Typography/figures";

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
 * @param {number} props.quantityProduced
 * @param {(value: number) => string} props.formatIsk
 */
export default function CostTable({ cost, quantityProduced, formatIsk }) {
  const perUnit = (value) =>
    quantityProduced > 0 ? formatIsk(value / quantityProduced) : null;

  return (
    <Table size="small" aria-label="Cost breakdown">
      <TableHead>
        <TableRow>
          {COLUMNS.map((column) => (
            <TableCell key={column.id} align={column.align} sx={{ py: 0.5 }}>
              <FigureCaption>{column.label}</FigureCaption>
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {cost.toBuild.lines.map((line) => (
          <CostRow key={line.id} line={line} formatIsk={formatIsk} perUnit={perUnit} />
        ))}
        <SubtotalRow
          label="Cost to build"
          value={cost.toBuild.total}
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
        <Figure>{perUnit(line.value)}</Figure>
      </TableCell>
    </TableRow>
  );
}

/**
 * Closes a band. Ruled above rather than below, so it reads as the sum of what
 * is over it rather than the start of what is under it.
 *
 * @param {object} props
 */
function SubtotalRow({ label, value, formatIsk, perUnit }) {
  return (
    <TableRow>
      <TableCell sx={{ borderTop: 1, borderColor: "divider", fontWeight: 500 }}>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {label}
        </Typography>
      </TableCell>
      <TableCell align="right" sx={{ borderTop: 1, borderColor: "divider" }}>
        <Figure sx={{ fontWeight: 500 }}>{formatIsk(value)}</Figure>
      </TableCell>
      <TableCell align="right" sx={{ borderTop: 1, borderColor: "divider" }}>
        <Figure sx={{ fontWeight: 500 }}>{perUnit(value)}</Figure>
      </TableCell>
    </TableRow>
  );
}

/**
 * Names the band beneath it. The selling costs are a separate question from the
 * build's, and are only paid if the output is listed at all.
 *
 * @param {object} props
 */
function BandRow({ label }) {
  return (
    <TableRow>
      <TableCell colSpan={COLUMNS.length} sx={{ borderBottom: 0, pt: 2 }}>
        <Figure tone={FIGURE_TONE.WARN} variant="caption">
          {label}
        </Figure>
      </TableCell>
    </TableRow>
  );
}
