import { alpha } from "@mui/material/styles";

/**
 * The colour each part of a build's cost is drawn in.
 *
 * The proportion bar and the dot beside each table row read this, so a segment
 * and its row cannot drift apart — the bar is only legible because the dot next
 * to a figure names which band of it that figure is.
 *
 * Building shades of one colour and selling shades of another says which side of
 * the total a line belongs to before any label is read.
 */

const BUILD_WEIGHTS = { bought: 1, built: 0.68, install: 0.4, extras: 0.18 };
const SELL_WEIGHTS = { brokerFee: 0.75, salesTax: 0.45 };

/**
 * @param {object} theme
 * @param {string} id - A cost line's id
 * @returns {string} A CSS colour
 */
export function costPartColour(theme, id) {
  if (id in SELL_WEIGHTS) {
    return alpha(theme.palette.error.main, SELL_WEIGHTS[id]);
  }
  return alpha(theme.palette.primary.main, BUILD_WEIGHTS[id] ?? 0.18);
}

/**
 * Every line of a breakdown as a part the proportion bar can draw, in the order
 * the table lists them.
 *
 * @param {import("../../../../../../Functions/MarketData/costBreakdown").CostBreakdown} cost
 * @param {object} theme
 * @returns {Array<{id: string, label: string, value: number, colour: string}>}
 */
export function costParts(cost, theme) {
  return [...(cost?.toBuild?.lines ?? []), ...(cost?.toSell?.lines ?? [])].map(
    (line) => ({
      id: line.id,
      label: line.label,
      value: line.value,
      colour: costPartColour(theme, line.id),
    }),
  );
}
