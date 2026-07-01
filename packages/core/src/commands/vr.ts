import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { type Page, browser, homeDir, intro, loadFlow, log, outro, visual } from "@fex/kit";

const VIEWPORTS: Record<string, { width: number; height: number }> = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
};

export interface VrOptions {
  name?: string;
  viewports: string;
  dark?: boolean;
  mask?: string;
  flow?: string;
  threshold?: string;
  failRatio?: string;
}

interface Variant {
  key: string;
  width: number;
  height: number;
  colorScheme: "light" | "dark";
}

function buildVariants(options: VrOptions): Variant[] {
  const names = options.viewports
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
  const variants: Variant[] = [];
  for (const name of names) {
    const viewport = VIEWPORTS[name];
    if (!viewport) {
      throw new Error(
        `Unknown viewport "${name}" — pick from: ${Object.keys(VIEWPORTS).join(", ")}`,
      );
    }
    variants.push({ key: name, ...viewport, colorScheme: "light" });
    if (options.dark) variants.push({ key: `${name}-dark`, ...viewport, colorScheme: "dark" });
  }
  return variants;
}

async function resolvePrepare(
  flowSpec: string | undefined,
): Promise<((page: Page) => Promise<void>) | undefined> {
  if (!flowSpec) return undefined;
  const [flowName, stepName] = flowSpec.split(":");
  if (!flowName || !stepName) {
    throw new Error(`--flow expects "<name>:<step>", got "${flowSpec}"`);
  }
  const flow = await loadFlow(flowName);
  const step = flow[stepName];
  if (typeof step !== "function") {
    throw new Error(`Flow "${flowName}" has no step named "${stepName}"`);
  }
  return async (page) => {
    await step(page);
  };
}

export async function vrCommand(action: string, url: string, options: VrOptions): Promise<void> {
  intro(`fex vr ${action}`);

  try {
    if (action !== "update" && action !== "test") {
      throw new Error(`Unknown action "${action}" — use \`vr update\` or \`vr test\`.`);
    }

    const name = options.name ?? new URL(url).host.replaceAll(":", "-");
    const dir = join(homeDir(), "baselines", name);
    await mkdir(dir, { recursive: true });

    const variants = buildVariants(options);
    const mask = options.mask
      ?.split(",")
      .map((selector) => selector.trim())
      .filter(Boolean);
    const prepare = await resolvePrepare(options.flow);

    let failures = 0;
    for (const variant of variants) {
      const baselinePath = join(dir, `${variant.key}.png`);
      const captureOptions = {
        width: variant.width,
        height: variant.height,
        colorScheme: variant.colorScheme,
        mask,
        prepare,
      };

      if (action === "update") {
        await browser.capture(url, baselinePath, captureOptions);
        log.success(`${variant.key}: baseline written`);
        continue;
      }

      if (!existsSync(baselinePath)) {
        log.warn(`${variant.key}: no baseline yet — run \`fex vr update ${url} --name ${name}\``);
        failures++;
        continue;
      }

      const currentPath = join(dir, `${variant.key}.current.png`);
      const diffPath = join(dir, `${variant.key}.diff.png`);
      await browser.capture(url, currentPath, captureOptions);
      const result = await visual.diffImages(baselinePath, currentPath, diffPath, {
        threshold: options.threshold ? Number(options.threshold) : undefined,
        failRatio: options.failRatio ? Number(options.failRatio) : undefined,
      });

      const pct = (result.diffRatio * 100).toFixed(3);
      const grew = result.sizeMismatch ? " (page size changed)" : "";
      if (result.passed) {
        log.success(`${variant.key}: ${pct}% diff`);
      } else {
        log.error(`${variant.key}: ${pct}% diff${grew} — see ${diffPath}`);
        failures++;
      }
    }

    if (action === "update") {
      outro(`Baselines in ${dir} — check with \`fex vr test ${url} --name ${name}\``);
    } else if (failures > 0) {
      process.exitCode = 1;
      outro(`${failures}/${variants.length} variant(s) failed`);
    } else {
      outro(`All ${variants.length} variant(s) match`);
    }
  } catch (error) {
    log.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
    outro("done");
  }
}
