import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";

import LandingScreen from "./App";
import "./index.css";

const app = (
  <StrictMode>
    <LandingScreen />
  </StrictMode>
);

const root = document.getElementById("root")!;

if (root.hasChildNodes()) {
  hydrateRoot(root, app);
} else {
  createRoot(root).render(app);
}
