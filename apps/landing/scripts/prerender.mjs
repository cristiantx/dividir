import { readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(scriptDir, "..");
const distDir = resolve(appDir, "dist");
const htmlPath = resolve(distDir, "index.html");
const serverEntryPath = resolve(distDir, "server", "entry-server.js");

const [{ render }, template] = await Promise.all([
  import(serverEntryPath),
  readFile(htmlPath, "utf8"),
]);

const appHtml = render();

const html = template.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);

await writeFile(htmlPath, html);
await rm(resolve(distDir, "server"), { force: true, recursive: true });
