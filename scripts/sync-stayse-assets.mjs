import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const source = resolve(root, "public/assets/stayse");
const target = resolve(root, "dist/assets/stayse");
const assetsDir = resolve(root, "dist/assets");

if (existsSync(source)) {
  mkdirSync(assetsDir, { recursive: true });

  if (existsSync(target)) {
    rmSync(target, { recursive: true, force: true });
  }

  cpSync(source, target, { recursive: true, force: true });
  console.log("[sync-stayse-assets] copied public/assets/stayse -> dist/assets/stayse");
} else {
  console.log("[sync-stayse-assets] skipped: public/assets/stayse not found");
}
