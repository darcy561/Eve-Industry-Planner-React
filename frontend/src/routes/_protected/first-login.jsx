import { createFileRoute } from "@tanstack/react-router";
import FirstLoginPage from "../../Components/First Login/page/FirstLoginPage";

export const Route = createFileRoute("/_protected/first-login")({
  component: FirstLoginPage,
});
