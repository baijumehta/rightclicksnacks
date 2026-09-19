/**
 * Run an image through the photo importer and print what came back.
 *
 *   npx tsx --conditions=react-server scripts/try-photo.ts path/to/photo.jpg
 *
 * Useful for checking a real shelf tag before trusting the feature, and for
 * seeing what the model does with a bad photo.
 */
import "./env.ts";
import { readFileSync } from "node:fs";
import { basename, extname } from "node:path";
import { readSnackFromPhoto } from "../src/lib/photo-import.ts";
import { describeAuth } from "../src/lib/anthropic-client.ts";

const path = process.argv[2];
if (!path) throw new Error("Give me an image path.");

const TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};
const type = TYPES[extname(path).toLowerCase()];
if (!type) throw new Error(`Not an image I can send: ${path}`);

const bytes = readFileSync(path);
const file = new File([new Uint8Array(bytes)], basename(path), { type });

console.log(`auth:  ${describeAuth()}`);
console.log(`image: ${basename(path)}, ${(bytes.length / 1024).toFixed(0)}KB, ${type}\n`);

const started = Date.now();
const result = await readSnackFromPhoto(file);
const seconds = ((Date.now() - started) / 1000).toFixed(1);

if (!result.ok) {
  console.log(`FAILED after ${seconds}s: ${result.message}`);
  process.exit(1);
}

console.log(`Read in ${seconds}s:\n`);
for (const [key, value] of Object.entries(result.draft)) {
  console.log(`  ${key.padEnd(12)}${value === undefined ? "" : String(value)}`);
}
process.exit(0);
