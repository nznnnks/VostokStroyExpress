import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const syncScript = resolve(__dirname, "sync-stayse-assets.mjs");
const targetFile = resolve(root, "dist/assets/stayse/logos/regent.svg");
const astroBin = resolve(root, "node_modules/.bin/astro");
const args = process.argv.slice(2);

async function syncAssets() {
  const moduleUrl = new URL(`file://${syncScript}`);
  const imported = await import(`${moduleUrl.href}?t=${Date.now()}`);
  return imported;
}

await syncAssets();

const child = spawn(astroBin, args, {
  cwd: root,
  stdio: "inherit",
  shell: false,
});

const interval = setInterval(async () => {
  if (!existsSync(targetFile)) {
    try {
      await syncAssets();
    } catch (error) {
      console.error("[dev-with-assets] sync failed", error);
    }
  }
}, 750);

function shutdown(code = 0) {
  clearInterval(interval);
  if (!child.killed) {
    child.kill("SIGTERM");
  }
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

child.on("exit", (code) => {
  clearInterval(interval);
  process.exit(code ?? 0);
});
