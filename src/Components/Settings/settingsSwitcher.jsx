import { remoteConfig } from "../../firebase";
import { getBoolean } from "firebase/remote-config";
import SettingsPage from "./Settings";
import SettingsPageV2 from "./settingsV2";

function SettingsPageVersionSwitcher({ colorMode }) {
  const usev2 = getBoolean(remoteConfig, "useSettingsV2");

  if (usev2) {
    return <SettingsPageV2 colorMode={colorMode} />;
  } else {
    return <SettingsPage colorMode={colorMode} />;
  }
}

export default SettingsPageVersionSwitcher;
