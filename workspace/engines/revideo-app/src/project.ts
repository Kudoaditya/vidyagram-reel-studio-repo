import { makeProject } from "@revideo/core";
import explainer from "./scenes/explainer?scene";

export default makeProject({
  scenes: [explainer],
  variables: { title: "How it works", steps: ["Record", "Cut", "Animate"] },
  settings: {
    shared: { size: { x: 1080, y: 1920 }, background: "#0b0b10" },
    rendering: { fps: 30 },
    preview: { fps: 30 },
  },
});
