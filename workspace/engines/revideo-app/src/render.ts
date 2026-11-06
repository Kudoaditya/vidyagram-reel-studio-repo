// Usage: npm run render -- [outFile.mp4] [variables.json]
// Renders ./src/project.ts to ../../output_renders/<outFile> (default revideo-explainer.mp4).
import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import puppeteer from "puppeteer";
import { renderVideo } from "@revideo/renderer";

const outFile = (process.argv[2] ?? "revideo-explainer.mp4") as `${string}.mp4`;
const outDir = resolve(import.meta.dirname, "../../../output_renders");
const variables = process.argv[3] ? JSON.parse(readFileSync(process.argv[3], "utf8")) : undefined;
const stem = outFile.replace(/\.mp4$/, "");

// Revideo always adds --single-process, which crashes full headless Chrome on macOS;
// chrome-headless-shell tolerates it. Re-download it if the puppeteer cache was cleared.
async function ensureHeadlessShell(): Promise<void> {
  const exe = await puppeteer.executablePath({ headless: "shell" });
  if (existsSync(exe)) return;
  console.log("chrome-headless-shell missing — downloading (one time)...");
  execSync("npx --no-install puppeteer browsers install chrome-headless-shell", { stdio: "inherit" }); // shell form works for npx.cmd on Windows too
}

// Remove the per-worker intermediates (<stem>-0.mp4, -audio.wav, -visuals.mp4) Revideo leaves behind.
function cleanIntermediates(): void {
  for (const f of readdirSync(outDir)) {
    if (f.startsWith(`${stem}-`) && /-(\d+\.mp4|audio\.wav|visuals\.mp4)$/.test(f)) rmSync(join(outDir, f));
  }
}

const render = () =>
  renderVideo({
    projectFile: "./src/project.ts",
    variables,
    settings: {
      outFile,
      outDir,
      logProgress: true,
      puppeteer: { headless: "shell" },
      projectSettings: { size: { x: 1080, y: 1920 } },
    },
  });

await ensureHeadlessShell();
let file: string;
try {
  file = await render();
} catch (err) {
  // The first render after a fresh install can fail while Revideo fetches assets; one retry fixes it.
  console.warn(`Render failed (${(err as Error).message.split("\n")[0]}) — retrying once...`);
  cleanIntermediates();
  file = await render();
}
cleanIntermediates();
console.log(`Rendered: ${file}`);
