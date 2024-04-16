import { Container, Grid, Paper } from "@mui/material";
import { useContext } from "react";
import { UsersContext } from "../../Context/AuthContext";
import { ClassicEditJobSettings } from "./SettingsModules/Classic/classicEditJobSettings";
import { ClassicLayoutSettings } from "./SettingsModules/Classic/classicLayoutSettings";
import { ClassicManufacturingStrutures } from "./SettingsModules/Classic/classicManufacturingStructures";
import { ClassicReactionStrutures } from "./SettingsModules/Classic/classicReactionStructures";
import { CompactLayoutSettings } from "./SettingsModules/Compact/compactLayoutSettings";
import { CompactEditJobSettings } from "./SettingsModules/Compact/compactEditJobSettings";
import { CompactManufacturingStrutures } from "./SettingsModules/Compact/compactManufacturingStructures";
import { CompactReactionStrutures } from "./SettingsModules/Compact/compactReactionStructures";
import { useHelperFunction } from "../../Hooks/GeneralHooks/useHelperFunctions";
import { Header } from "../Header";
import { Footer } from "../Footer/Footer";

export default function SettingsPage({ colorMode }) {
  const { users } = useContext(UsersContext);
  const { findParentUserIndex } = useHelperFunction();
  const parentUserIndex = findParentUserIndex();
  return (
    <Container disableGutters maxWidth="false">
      <Header colorMode={colorMode} />
      <Paper
        elevation={3}
        sx={{
          padding: "20px",
          marginTop: 10,
          marginLeft: { md: "10px" },
          marginRight: { md: "10px" },
          marginBottom: "20px",
        }}
        square
      >
        <Grid container spacing={2}>
          {users[parentUserIndex].settings.layout.enableCompactView ? (
            <>
              <Grid item xs={12} md={6}>
                <CompactLayoutSettings parentUserIndex={parentUserIndex} />
              </Grid>
              <Grid item xs={12} md={6}>
                <CompactEditJobSettings parentUserIndex={parentUserIndex} />
              </Grid>
              <Grid item xs={12} md={6}>
                <CompactManufacturingStrutures
                  parentUserIndex={parentUserIndex}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <CompactReactionStrutures parentUserIndex={parentUserIndex} />
              </Grid>
            </>
          ) : (
            <>
              <Grid item xs={12} md={6}>
                <ClassicLayoutSettings parentUserIndex={parentUserIndex} />
              </Grid>
              <Grid item xs={12} md={6}>
                <ClassicEditJobSettings parentUserIndex={parentUserIndex} />
              </Grid>
              <Grid item xs={12} md={6}>
                <ClassicManufacturingStrutures
                  parentUserIndex={parentUserIndex}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <ClassicReactionStrutures parentUserIndex={parentUserIndex} />
              </Grid>
            </>
          )}
        </Grid>
      </Paper>
      <Footer />
    </Container>
  );
}
