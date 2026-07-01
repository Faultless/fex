import { existsSync } from "node:fs";
import { browser, intro, log, outro, visual } from "@fex/kit";

export interface ScreenshotDiffOptions {
  out?: string;
  threshold?: string;
}

function isUrl(value: string): boolean {
  return /^https?:\/\//.test(value);
}

async function resolveImage(input: string, label: string): Promise<string> {
  if (!isUrl(input)) return input;
  const path = `/tmp/fex-screenshot-${label}-${Date.now()}.png`;
  await browser.capture(input, path);
  return path;
}

export async function screenshotDiffCommand(
  before: string,
  after: string,
  options: ScreenshotDiffOptions,
): Promise<void> {
  intro("fex screenshot-diff");

  try {
    const [beforePath, afterPath] = await Promise.all([
      resolveImage(before, "before"),
      resolveImage(after, "after"),
    ]);

    for (const path of [beforePath, afterPath]) {
      if (!existsSync(path)) throw new Error(`${path} does not exist`);
    }

    const outPath = options.out ?? "diff.png";
    const result = await visual.diffImages(beforePath, afterPath, outPath, {
      threshold: options.threshold ? Number(options.threshold) : undefined,
    });
    const pct = (result.diffRatio * 100).toFixed(3);
    const summary = `${pct}% different (${result.diffPixels}/${result.totalPixels} px), diff written to ${outPath}`;

    if (result.passed) {
      log.success(`Match — ${summary}`);
    } else {
      log.error(`Mismatch — ${summary}`);
      process.exitCode = 1;
    }
  } catch (error) {
    log.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }

  outro("done");
}
