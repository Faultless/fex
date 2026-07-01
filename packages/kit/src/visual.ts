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
}

/** Pixel-diffs two same-size PNGs, writes a visual diff to `outDiffPath`. */
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
  const imgA = PNG.sync.read(Buffer.from(bufferA));
  const imgB = PNG.sync.read(Buffer.from(bufferB));

  if (imgA.width !== imgB.width || imgA.height !== imgB.height) {
    throw new Error(
      `Image size mismatch: ${pathA} is ${imgA.width}x${imgA.height}, ${pathB} is ${imgB.width}x${imgB.height}`,
    );
  }

  const { width, height } = imgA;
  const diff = new PNG({ width, height });
  const diffPixels = pixelmatch(imgA.data, imgB.data, diff.data, width, height, {
    threshold: options.threshold ?? 0.1,
  });

  await Bun.write(outDiffPath, PNG.sync.write(diff));

  const totalPixels = width * height;
  const diffRatio = diffPixels / totalPixels;
  const passed = diffRatio <= (options.failRatio ?? 0.001);

  return { width, height, diffPixels, totalPixels, diffRatio, passed };
}
