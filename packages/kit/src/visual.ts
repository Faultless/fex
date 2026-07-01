import type { PNG as PNGType } from "pngjs";
import { optionalImport } from "./lazy";

const INSTALL_HINT = "bun add -D pixelmatch pngjs @types/pngjs";

export interface DiffOptions {
  /** Per-pixel color difference threshold, 0-1 (pixelmatch default 0.1). */
  threshold?: number;
  /** Fraction of differing pixels above which the diff is considered a failure. */
  failRatio?: number;
}

export interface DiffResult {
  width: number;
  height: number;
  diffPixels: number;
  totalPixels: number;
  diffRatio: number;
  passed: boolean;
  /** True when the inputs had different dimensions and were padded to the union size. */
  sizeMismatch: boolean;
}

/** Fill color for padded regions — loud so grown/shrunk areas always register as diff. */
const PAD_RGBA = [255, 0, 255, 255] as const;

function padTo(img: PNGType, width: number, height: number, PNG: typeof PNGType): PNGType {
  if (img.width === width && img.height === height) return img;
  const out = new PNG({ width, height });
  for (let i = 0; i < out.data.length; i += 4) {
    out.data[i] = PAD_RGBA[0];
    out.data[i + 1] = PAD_RGBA[1];
    out.data[i + 2] = PAD_RGBA[2];
    out.data[i + 3] = PAD_RGBA[3];
  }
  for (let y = 0; y < img.height; y++) {
    img.data.copy(out.data, y * width * 4, y * img.width * 4, (y + 1) * img.width * 4);
  }
  return out;
}

/**
 * Pixel-diffs two PNGs, writes a visual diff to `outDiffPath`. Different-size inputs
 * (e.g. a full-page screenshot of a page that grew) are padded to the union size and
 * the padding counts as diff, rather than erroring out.
 */
export async function diffImages(
  pathA: string,
  pathB: string,
  outDiffPath: string,
  options: DiffOptions = {},
): Promise<DiffResult> {
  const { default: pixelmatch } = await optionalImport<{ default: (...args: unknown[]) => number }>(
    "pixelmatch",
    INSTALL_HINT,
  );
  const { PNG } = await optionalImport<typeof import("pngjs")>("pngjs", INSTALL_HINT);

  const [bufferA, bufferB] = await Promise.all([
    Bun.file(pathA).arrayBuffer(),
    Bun.file(pathB).arrayBuffer(),
  ]);
  const rawA = PNG.sync.read(Buffer.from(bufferA));
  const rawB = PNG.sync.read(Buffer.from(bufferB));

  const width = Math.max(rawA.width, rawB.width);
  const height = Math.max(rawA.height, rawB.height);
  const sizeMismatch = rawA.width !== rawB.width || rawA.height !== rawB.height;
  const imgA = padTo(rawA, width, height, PNG);
  const imgB = padTo(rawB, width, height, PNG);

  const diff = new PNG({ width, height });
  const diffPixels = pixelmatch(imgA.data, imgB.data, diff.data, width, height, {
    threshold: options.threshold ?? 0.1,
  });

  await Bun.write(outDiffPath, PNG.sync.write(diff));

  const totalPixels = width * height;
  const diffRatio = diffPixels / totalPixels;
  const passed = diffRatio <= (options.failRatio ?? 0.001);

  return { width, height, diffPixels, totalPixels, diffRatio, passed, sizeMismatch };
}
