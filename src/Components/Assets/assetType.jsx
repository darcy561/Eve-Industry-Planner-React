import { Grid, Paper } from "@mui/material";

export function AssetType({ locationAsset, fullAssetList }) {
  return (
    <Grid container item xs={12} spacing={2}>
      {locationAsset.map((assetType) => {
        return (
          <Grid key={assetType.type_id} container item xs={12} sm={6}>
            <Paper
              square={true}
              elevation={2}
              sx={{ width: "100%", padding: "20px" }}
            >
              <Grid container>
                <Grid item xs={12}>
                  {assetType.type_id}
                </Grid>
                <Grid container item xs={12}>
                  {assetType.itemIDs.map((item) => {
                    return (
                      <Grid key={item} item xs={4}>
                        {item}
                      </Grid>
                    );
                  })}
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        );
      })}
    </Grid>
  );
}
