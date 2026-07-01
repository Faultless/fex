import { expect, test } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PNG } from "pngjs";
import { diffImages } from "./visual";

function writePng(
  path: string,
  width: number,
  height: number,
  rgba: [number, number, number, number],
): void {
  const png = new PNG({ width, height });
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = rgba[0];
    png.data[i + 1] = rgba[1];
    png.data[i + 2] = rgba[2];
    png.data[i + 3] = rgba[3];
  }
  writeFileSync(path, PNG.sync.write(png));
}

test("identical images pass with zero diff", async () => {
  const dir = mkdtempSync(join(tmpdir(), "fex-visual-"));
  const a = join(dir, "a.png");
  const b = join(dir, "b.png");
  writePng(a, 20, 20, [10, 200, 30, 255]);
  writePng(b, 20, 20, [10, 200, 30, 255]);

  const result = await diffImages(a, b, join(dir, "diff.png"));
  expect(result.diffPixels).toBe(0);
  expect(result.passed).toBe(true);
  expect(result.sizeMismatch).toBe(false);
});

test("different-size images are padded and diffed instead of throwing", async () => {
  const dir = mkdtempSync(join(tmpdir(), "fex-visual-"));
  const a = join(dir, "a.png");
  const b = join(dir, "b.png");
  writePng(a, 20, 20, [10, 200, 30, 255]);
  writePng(b, 20, 30, [10, 200, 30, 255]); // same content, page "grew" by 10 rows

  const result = await diffImages(a, b, join(dir, "diff.png"));
  expect(result.sizeMismatch).toBe(true);
  expect(result.width).toBe(20);
  expect(result.height).toBe(30);
  // the grown region (20x10) must register as diff
  expect(result.diffPixels).toBe(20 * 10);
  expect(result.passed).toBe(false);
});
