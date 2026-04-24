import { renderToString } from "react-dom/server";

import LandingScreen from "./App";

export function render() {
  return renderToString(<LandingScreen />);
}
