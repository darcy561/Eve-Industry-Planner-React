import { Chip, Grid } from "@mui/material";
import {
  TWO_DECIMAL_PLACES,
  ZERO_DECIMAL_PLACES,
} from "../../../../../../Context/defaultValues";
import ClearIcon from "@mui/icons-material/Clear";

export function MaterialCostsFrame_Purchasing({ material }) {



    
  return (
    <Grid container sx={{ height: "8vh", overflowY: "auto" }}>
      {material.purchasing.map((record) => {
        return (
          <Grid
            key={record.id}
            container
            item
            justifyContent="center"
            alignItems="center"
            sx={{ marginBottom: "5px" }}
          >
            <Chip
              label={`${record.itemCount.toLocaleString(
                undefined,
                ZERO_DECIMAL_PLACES
              )} @ ${record.itemCost.toLocaleString(
                undefined,
                TWO_DECIMAL_PLACES
              )} ISK Each`}
              variant="outlined"
              deleteIcon={<ClearIcon />}
              sx={{
                "& .MuiChip-deleteIcon": {
                  color: "error.main",
                },
                boxShadow: 2,
              }}
              onDelete={() => handleRemove(recordIndex)}
              color={record.childJobImport ? "primary" : "secondary"}
            />
          </Grid>
        );
      })}
    </Grid>
  );
}
