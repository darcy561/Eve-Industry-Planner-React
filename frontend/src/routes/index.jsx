import { createFileRoute } from "@tanstack/react-router";
import { Home } from "../Components/Landing Page";

export const Route = createFileRoute("/")({
  staticData: { audience: "public", resumeSession: false },
  component: Home,
});
