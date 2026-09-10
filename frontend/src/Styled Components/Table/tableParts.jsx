import { TableCell, TableHead, TableRow } from "@mui/material";

import { FigureCaption } from "../Typography/figures";

/**
 * The parts a figures table is made of, so a panel describes its columns rather
 * than laying out a header.
 */

/**
 * @typedef {object} TableColumn
 * @property {string} id
 * @property {React.ReactNode} label
 * @property {'left'|'right'|'center'} [align]
 */

/**
 * A table's column headings.
 *
 * Takes the columns rather than fixing them, because a panel may show one only
 * when it has something to put in it — the cost table's comparison against a
 * previous build appears only where there is history.
 *
 * @param {object} props
 * @param {TableColumn[]} props.columns
 */
export function ColumnHeaderRow({ columns }) {
  return (
    <TableHead>
      <TableRow>
        {columns.map((column) => (
          <TableCell
            key={column.id}
            align={column.align ?? "left"}
            sx={{ whiteSpace: "nowrap", py: 0.5 }}
          >
            <FigureCaption>{column.label}</FigureCaption>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}
