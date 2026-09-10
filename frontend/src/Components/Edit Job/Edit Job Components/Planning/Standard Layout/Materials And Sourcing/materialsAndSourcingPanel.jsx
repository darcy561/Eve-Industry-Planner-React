import { useState } from "react";
import { MenuItem, Select, Stack } from "@mui/material";

import AppShellPanel from "../../../../../../Styled Components/Paper/AppShellPanel";
import PricingBasisSelect from "../../../../../../Styled Components/Select/pricingBasis";
import writeTextToClipboard from "../../../../../../Functions/Clipboard/writeTextToClipboard";
import MaterialDrawer from "./materialDrawer";
import MaterialsTable from "./materialsTable";
import { SourcingFooter, SourcingOffer } from "./sourcingSummary";
import { useMaterialsSourcing } from "./useMaterialsSourcing";

/**
 * What the build takes, and whether each part is bought or built.
 *
 * Replaces Raw Resources and the market panel's cost rows, which drew the same
 * material list twice with different figures on it.
 *
 * @param {object} props
 * @param {object} props.state - Edit Job state
 * @param {object} props.actions - Edit Job actions
 * @param {(value: number) => string} props.formatIsk
 * @param {(value: number) => string} props.formatQuantity
 * @param {(value: number) => string} props.formatVolume
 * @param {(basisID: string) => void} props.onChangeBasis
 * @param {() => void} props.onApplyBuildable - Switches every cheaper-to-build row
 * @param {boolean} [props.readOnly]
 */
export default function MaterialsAndSourcingPanel({
  state,
  actions,
  formatIsk,
  formatQuantity,
  formatVolume,
  onChangeBasis,
  onApplyBuildable,
  readOnly = false,
}) {
  const [displayType, setDisplayType] = useState("all");
  const [openTypeIDs, setOpenTypeIDs] = useState([]);

  const { rows, summary, basisOptions } = useMaterialsSourcing({
    state,
    actions,
    displayType,
  });

  if (!state.activeJob?.selectedSetup) return null;

  const toggleRow = (typeID) =>
    setOpenTypeIDs((open) =>
      open.includes(typeID)
        ? open.filter((id) => id !== typeID)
        : [...open, typeID]
    );

  return (
    <AppShellPanel
      title="Materials & Sourcing"
      componentName="MaterialsAndSourcingPanel"
      action={
        <PricingBasisSelect
          options={basisOptions}
          formatValue={formatIsk}
          label="Materials"
          onChange={onChangeBasis}
          disabled={readOnly}
        />
      }
      enableMenu
      menuItems={[
        {
          label: "Copy Resources List",
          onClick: () => writeTextToClipboard(resourceListText(rows)),
        },
      ]}
    >
      <Stack spacing={1.5}>
        <Select
          variant="standard"
          size="small"
          value={displayType}
          onChange={(event) => setDisplayType(event.target.value)}
          sx={{ alignSelf: "flex-start" }}
          inputProps={{ "aria-label": "Which requirement to show" }}
        >
          <MenuItem value="all">Total Job</MenuItem>
          <MenuItem value="active">Selected Setup</MenuItem>
        </Select>

        <SourcingOffer
          summary={summary}
          formatIsk={formatIsk}
          onApply={onApplyBuildable}
          disabled={readOnly}
        />

        <MaterialsTable
          rows={rows}
          formatIsk={formatIsk}
          formatQuantity={formatQuantity}
          onToggleRow={toggleRow}
          openTypeIDs={openTypeIDs}
          renderDrawer={(row, isOpen) => (
            <MaterialDrawer
              isOpen={isOpen}
              state={state}
              actions={actions}
              material={row.material}
              matchedChildJobs={row.matchedChildJobs}
              marketSelect={row.marketSelect}
              listingSelect={row.listingSelect}
              currentMaterialPrice={row.buyPrice ?? 0}
            />
          )}
        />

        <SourcingFooter summary={summary} formatVolume={formatVolume} />
      </Stack>
    </AppShellPanel>
  );
}

/**
 * The list as a player pastes it into the game, one material and quantity a line.
 *
 * @param {import("../../../../../../Functions/MarketData/materialSourcingRow").MaterialSourcingRow[]} rows
 * @returns {string}
 */
function resourceListText(rows) {
  return rows.map((row) => `${row.name} ${row.quantity}`).join("\n") + "\n";
}

export { resourceListText };
