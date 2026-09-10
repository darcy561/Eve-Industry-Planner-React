# Checking the selling charges against stored jobs

The broker fee and sales tax the Planning stage quotes are worked out from published EVE constants.
Stored jobs carry what was actually charged on real sales, so the formulas can be checked against
reality rather than against a fixture that agrees with them by construction.

Run against `eve_industry_planner_snapshot` — the live database restored locally — on 2026-09-10.
The two extraction scripts beside this file are what produced the numbers; they read only, and print
one JSON object per line for analysis outside mongosh.

## What the documents actually carry

| Field | Where | What it is |
|-------|-------|-----------|
| `build.sale.brokersFee[].amount` | archived + live jobs | What **the app calculated** and stored |
| `build.sale.marketOrders[].item_price` × `volume_total` | same | The order's value, **as it stands now** |
| `build.sale.marketOrders[].timeStamps` | same | One entry per time the order was seen; more than one means it was repriced |
| `build.sale.transactions[].tax` | same | What **EVE actually charged** — a real figure, not ours |

The broker fee is therefore self-reported and can only be checked for internal consistency. The sales
tax is independent evidence, which makes it the stronger of the two checks.

## Sales tax — checked against what EVE charged

43,589 stored transactions carry a real tax figure. Solving each for the base rate it implies, at every
Accounting level, and matching against published base rates:

| Year | 2.25% | 3.6% | 4.5% | 7.5% | 8.0% |
|------|------:|-----:|-----:|-----:|-----:|
| 2022 |       |  378 |      |    1 | 1853 |
| 2023 |   173 | 1472 |    4 |    6 | 12537 |
| 2024 |     1 |  102 | 2159 |      | 2963 |
| 2025 |     3 |    5 |  507 | 8883 |      |
| 2026 |     1 |    6 |    3 | 9311 |      |

7.3% (3,176) match no published base — consistent with partial fills, where the tax is charged against
a different quantity than the row's own `unit_price × quantity`.

**The app's `salesTaxRates.base` of 7.5% is right for current data.** It dominates 2025 and 2026 and
appears essentially nowhere before that; the earlier years show the base EVE charged at the time. The
11%-per-level Accounting reduction reproduces the real figures at every level it appears at — 16,646
transactions land exactly on 3.375%, which is 7.5% at Accounting V.

This also means **a stored fee is only checkable against the constants in force when it was charged**.
The app holds one base rate; historical figures were charged against others.

## Broker fee — checked for consistency with the published formula

3,831 stored fees, of which 3,531 are at NPC stations and 300 at citadels.

A repriced order breaks the check: the fee was charged on the value at listing, and the document holds
the value now. Splitting on it:

| Order | Fits `3% − 0.3×BrokerRelations − standings` | Implies a rate below the minimum | Implies above 3% |
|-------|-----:|-----:|-----:|
| Never repriced | 1,611 | 1 | 17 |
| Repriced | 998 | 632 | 272 |

**On the 1,629 fees whose orders were never repriced, 99.1% fit the published formula.** The
arithmetic is sound. The 904 apparent failures are almost entirely an artefact of comparing a fee
against a price it was not charged on — worth knowing before anyone reads a spreadsheet of stored fees
and concludes the calculation is wrong.

**The 100 ISK minimum has never once applied**: 0 of 3,531 station fees sit on the floor. It is
published behaviour and worth keeping, but no real sale has been small enough to meet it.

### What this cannot settle

Whether **faction** standing specifically was ever applied. A rate slightly above one Broker Relations
level is equally explained by negative standings at the level above, so the reduction cannot be
attributed to faction rather than corporation without knowing the character's actual levels, which the
documents do not carry.

### One observation worth following up

Among fees on never-repriced station orders, how many show any standings contribution at all:

| Year | Consistent with no standings | Standings must have applied |
|------|-----:|-----:|
| 2022 | 24 | 18 |
| 2023 | 105 | 634 |
| 2024 | 139 | 228 |
| 2025 | 64 | 341 |
| 2026 | 48 | 14 |

Standings applied in 62–84% of fees from 2023 to 2025, and in 23% of 2026's. That is the shape of
standings having stopped resolving, and it matches the report that prompted the faction-lookup fix —
but 2026 carries only 62 clean fees and no check was made of whether they belong to the same
characters, so it is a signal to chase rather than a conclusion.
