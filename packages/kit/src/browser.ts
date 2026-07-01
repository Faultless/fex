import type { Browser, Page } from "playwright";
import { optionalImport } from "./lazy";

export type { Page };

const INSTALL_HINT = "bun add -D playwright && bunx playwright install chromium";

async function launch(): Promise<Browser> {
  const playwright = await optionalImport<typeof import("playwright")>("playwright", INSTALL_HINT);
  return playwright.chromium.launch();
}

export interface CaptureOptions {
  width?: number;
  height?: number;
  fullPage?: boolean;
  waitForTimeout?: number;
}

/** Launches Chromium, navigates to `url`, and screenshots it to `outPath`. */
export async function capture(
  url: string,
  outPath: string,
  options: CaptureOptions = {},
): Promise<void> {
  const browser = await launch();
  try {
    const page = await browser.newPage({
      viewport: { width: options.width ?? 1280, height: options.height ?? 800 },
    });
    await page.goto(url, { waitUntil: "networkidle" });
    if (options.waitForTimeout) await page.waitForTimeout(options.waitForTimeout);
    await page.screenshot({ path: outPath, fullPage: options.fullPage ?? true });
  } finally {
    await browser.close();
  }
}

/** Opens `url` in a page, runs `fn` against it, and closes the browser afterwards — for scripted e2e/smoke flows. */
export async function withPage<T>(url: string, fn: (page: Page) => Promise<T>): Promise<T> {
  const browser = await launch();
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle" });
    return await fn(page);
  } finally {
    await browser.close();
  }
}
