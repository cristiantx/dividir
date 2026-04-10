#!/usr/bin/env node

import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import process from "node:process";
import { spawn } from "node:child_process";

import { PDFDocument } from "pdf-lib";
import sharp from "sharp";

const DEFAULT_DPI = 150;
const DEFAULT_THRESHOLD = 42;
const DEFAULT_EDGE_STRIP = 8;

function printUsage() {
  console.log(`Usage:
  node scripts/remove-pdf-background.mjs <input.pdf> [options]

Options:
  -o, --output <file>         Output PDF path
  --dpi <number>              Rasterization DPI (default: ${DEFAULT_DPI})
  --threshold <number>        Background color tolerance (default: ${DEFAULT_THRESHOLD})
  --edge-strip <number>       Pixels sampled from left/right edges (default: ${DEFAULT_EDGE_STRIP})
  --background <color>        Manual background color, like "#f2f0ef" or "242,240,239"
  --transparent               Make removed background transparent instead of white
  -h, --help                  Show this help
`);
}

function parseColor(value) {
  const normalized = value.trim();

  if (/^#[0-9a-f]{6}$/i.test(normalized)) {
    return {
      r: Number.parseInt(normalized.slice(1, 3), 16),
      g: Number.parseInt(normalized.slice(3, 5), 16),
      b: Number.parseInt(normalized.slice(5, 7), 16),
    };
  }

  const parts = normalized
    .split(",")
    .map((part) => Number.parseInt(part.trim(), 10))
    .filter((part) => Number.isFinite(part));

  if (parts.length === 3 && parts.every((part) => part >= 0 && part <= 255)) {
    return { r: parts[0], g: parts[1], b: parts[2] };
  }

  throw new Error(`Invalid background color "${value}". Use "#rrggbb" or "r,g,b".`);
}

function parseArgs(argv) {
  const options = {
    dpi: DEFAULT_DPI,
    threshold: DEFAULT_THRESHOLD,
    edgeStrip: DEFAULT_EDGE_STRIP,
    transparent: false,
    background: null,
  };

  const positional = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    switch (arg) {
      case "-h":
      case "--help":
        options.help = true;
        break;
      case "-o":
      case "--output":
        options.output = argv[++index];
        break;
      case "--dpi":
        options.dpi = Number.parseInt(argv[++index], 10);
        break;
      case "--threshold":
        options.threshold = Number.parseInt(argv[++index], 10);
        break;
      case "--edge-strip":
        options.edgeStrip = Number.parseInt(argv[++index], 10);
        break;
      case "--background":
        options.background = parseColor(argv[++index]);
        break;
      case "--transparent":
        options.transparent = true;
        break;
      default:
        if (arg.startsWith("-")) {
          throw new Error(`Unknown option "${arg}".`);
        }

        positional.push(arg);
        break;
    }
  }

  if (options.help) {
    return options;
  }

  if (positional.length === 0) {
    throw new Error("Missing input PDF path.");
  }

  if (!Number.isFinite(options.dpi) || options.dpi <= 0) {
    throw new Error(`Invalid DPI "${options.dpi}".`);
  }

  if (!Number.isFinite(options.threshold) || options.threshold < 0) {
    throw new Error(`Invalid threshold "${options.threshold}".`);
  }

  if (!Number.isFinite(options.edgeStrip) || options.edgeStrip <= 0) {
    throw new Error(`Invalid edge strip "${options.edgeStrip}".`);
  }

  options.input = positional[0];

  if (!options.output) {
    const parsed = path.parse(options.input);
    options.output = path.join(parsed.dir, `${parsed.name}.clean.pdf`);
  }

  return options;
}

function quantizeKey(r, g, b) {
  return `${r >> 4},${g >> 4},${b >> 4}`;
}

function colorDistanceSquared(r1, g1, b1, r2, g2, b2) {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;

  return dr * dr + dg * dg + db * db;
}

function detectBackgroundColor(data, width, height, channels, edgeStrip) {
  const strip = Math.min(edgeStrip, Math.max(1, Math.floor(width / 8)));
  const bins = new Map();

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < strip; x += 1) {
      const index = (y * width + x) * channels;
      const alpha = data[index + 3];

      if (alpha < 16) {
        continue;
      }

      const key = quantizeKey(data[index], data[index + 1], data[index + 2]);
      const entry = bins.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
      entry.count += 1;
      entry.r += data[index];
      entry.g += data[index + 1];
      entry.b += data[index + 2];
      bins.set(key, entry);
    }

    for (let x = Math.max(strip, width - strip); x < width; x += 1) {
      const index = (y * width + x) * channels;
      const alpha = data[index + 3];

      if (alpha < 16) {
        continue;
      }

      const key = quantizeKey(data[index], data[index + 1], data[index + 2]);
      const entry = bins.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
      entry.count += 1;
      entry.r += data[index];
      entry.g += data[index + 1];
      entry.b += data[index + 2];
      bins.set(key, entry);
    }
  }

  let best = null;

  for (const entry of bins.values()) {
    if (!best || entry.count > best.count) {
      best = entry;
    }
  }

  if (!best) {
    return { r: 255, g: 255, b: 255 };
  }

  return {
    r: Math.round(best.r / best.count),
    g: Math.round(best.g / best.count),
    b: Math.round(best.b / best.count),
  };
}

function floodFillBackground(data, width, height, channels, background, threshold, transparent) {
  const pixelCount = width * height;
  const visited = new Uint8Array(pixelCount);
  const queue = new Uint32Array(pixelCount);
  const thresholdSquared = threshold * threshold;
  let head = 0;
  let tail = 0;
  let removed = 0;

  const canRemove = (pixelIndex) => {
    const offset = pixelIndex * channels;
    const alpha = data[offset + 3];

    if (alpha < 16) {
      return false;
    }

    return (
      colorDistanceSquared(
        data[offset],
        data[offset + 1],
        data[offset + 2],
        background.r,
        background.g,
        background.b,
      ) <= thresholdSquared
    );
  };

  const enqueue = (pixelIndex) => {
    if (visited[pixelIndex] || !canRemove(pixelIndex)) {
      return;
    }

    visited[pixelIndex] = 1;
    queue[tail] = pixelIndex;
    tail += 1;
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x);
    enqueue((height - 1) * width + x);
  }

  for (let y = 0; y < height; y += 1) {
    enqueue(y * width);
    enqueue(y * width + (width - 1));
  }

  while (head < tail) {
    const pixelIndex = queue[head];
    head += 1;

    const x = pixelIndex % width;
    const y = Math.floor(pixelIndex / width);
    const offset = pixelIndex * channels;

    data[offset] = 255;
    data[offset + 1] = 255;
    data[offset + 2] = 255;
    data[offset + 3] = transparent ? 0 : 255;
    removed += 1;

    if (x > 0) {
      enqueue(pixelIndex - 1);
    }
    if (x + 1 < width) {
      enqueue(pixelIndex + 1);
    }
    if (y > 0) {
      enqueue(pixelIndex - width);
    }
    if (y + 1 < height) {
      enqueue(pixelIndex + width);
    }
  }

  return removed;
}

async function runPdftocairo(inputPath, outputPrefix, dpi) {
  await new Promise((resolve, reject) => {
    const child = spawn(
      "pdftocairo",
      ["-png", "-r", String(dpi), inputPath, outputPrefix],
      { stdio: "inherit" },
    );

    child.on("error", (error) => {
      if (error.code === "ENOENT") {
        reject(
          new Error(
            'Missing "pdftocairo". Install Poppler first, then re-run the script.',
          ),
        );
        return;
      }

      reject(error);
    });
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`pdftocairo exited with code ${code}.`));
    });
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printUsage();
    return;
  }

  const tempDir = await mkdtemp(path.join(os.tmpdir(), "pdf-bg-"));

  try {
    const inputBytes = await readFile(options.input);
    const inputPdf = await PDFDocument.load(inputBytes);
    const pageSizes = inputPdf.getPages().map((page) => page.getSize());

    await runPdftocairo(options.input, path.join(tempDir, "page"), options.dpi);

    const files = (await readdir(tempDir))
      .filter((file) => /^page-\d+\.png$/i.test(file))
      .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));

    if (files.length === 0) {
      throw new Error("No pages were rendered from the PDF.");
    }

    if (files.length !== pageSizes.length) {
      throw new Error(`Expected ${pageSizes.length} pages, but rendered ${files.length}.`);
    }

    const outputPdf = await PDFDocument.create();

    for (let pageIndex = 0; pageIndex < files.length; pageIndex += 1) {
      const filePath = path.join(tempDir, files[pageIndex]);
      const { data, info } = await sharp(filePath)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const background =
        options.background ??
        detectBackgroundColor(data, info.width, info.height, info.channels, options.edgeStrip);

      const removedPixels = floodFillBackground(
        data,
        info.width,
        info.height,
        info.channels,
        background,
        options.threshold,
        options.transparent,
      );

      const cleanedPng = await sharp(data, {
        raw: {
          width: info.width,
          height: info.height,
          channels: info.channels,
        },
      })
        .png()
        .toBuffer();

      const embedded = await outputPdf.embedPng(cleanedPng);
      const { width, height } = pageSizes[pageIndex];
      const page = outputPdf.addPage([width, height]);

      page.drawImage(embedded, {
        x: 0,
        y: 0,
        width,
        height,
      });

      const pageNumber = pageIndex + 1;
      const percent = ((removedPixels / (info.width * info.height)) * 100).toFixed(1);
      console.log(
        `Processed page ${pageNumber}/${files.length} with background rgb(${background.r}, ${background.g}, ${background.b}); removed ${percent}% of pixels.`,
      );
    }

    const outputBytes = await outputPdf.save();
    await writeFile(options.output, outputBytes);
    console.log(`Saved cleaned PDF to ${options.output}`);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
