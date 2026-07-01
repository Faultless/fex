import type { Browser, BrowserContext, Page } from "playwright";
import { optionalImport } from "./lazy";

export type { Page };

const INSTALL_HINT = "bun add -D playwright && bunx playwright install chromium";

async function launch(headed = false): Promise<Browser> {
  const playwright = await optionalImport<typeof import("playwright")>("playwright", INSTALL_HINT);
  return playwright.chromium.launch({ headless: !headed });
}

export interface PageOptions {
  width?: number;
  height?: number;
  /** Sets prefers-color-scheme for the page. */
  colorScheme?: "light" | "dark";
  /** Run a visible (non-headless) browser. */
  headed?: boolean;
  /**
   * Navigation wait state. Defaults to "load" — "networkidle" never settles on apps
   * that poll or hold websockets open, so opt into it per call if you need it.
   */
  waitUntil?: "load" | "domcontentloaded" | "networkidle" | "commit";
  /** Wait for this selector to be visible after navigation. */
  waitForSelector?: string;
  /** Extra settle time after navigation, in ms. */
  waitForTimeout?: number;
  /**
   * Record or replay request traffic through a HAR file (Playwright routeFromHAR).
   * `record` captures matching requests into the file as you browse; `replay` serves
   * matching requests from the file instead of the network.
   */
  har?: { path: string; mode: "record" | "replay"; urlFilter?: string };
}

interface OpenedPage {
  browser: Browser;
  context: BrowserContext;
  page: Page;
}

async function openPage(url: string, options: PageOptions): Promise<OpenedPage> {
  const browser = await launch(options.headed);
  try {
    const context = await browser.newContext({
      viewport: { width: options.width ?? 1280, height: options.height ?? 800 },
      colorScheme: options.colorScheme ?? "light",
    });
    if (options.har) {
      await context.routeFromHAR(options.har.path, {
        update: options.har.mode === "record",
        url: options.har.urlFilter,
      });
    }
    const page = await context.newPage();
    await page.goto(url, { waitUntil: options.waitUntil ?? "load" });
    if (options.waitForSelector) await page.waitForSelector(options.waitForSelector);
    if (options.waitForTimeout) await page.waitForTimeout(options.waitForTimeout);
    return { browser, context, page };
  } catch (error) {
    await browser.close();
    throw error;
  }
}

// Closing the context before the browser matters: routeFromHAR only flushes a
// recorded HAR to disk on context.close().
async function closePage(opened: OpenedPage): Promise<void> {
  await opened.context.close();
  await opened.browser.close();
}

export interface CaptureOptions extends PageOptions {
  fullPage?: boolean;
  /** CSS selectors to paint over before screenshotting (timestamps, avatars, ads). */
  mask?: string[];
  /** Disable animations/transitions and wait for web fonts — stable screenshots for diffing. Default true. */
  stabilize?: boolean;
  /** Runs against the page after navigation, before the screenshot — e.g. a flow step that logs in. */
  prepare?: (page: Page) => Promise<void>;
}

/** Launches Chromium, navigates to `url`, and screenshots it to `outPath`. */
export async function capture(
  url: string,
  outPath: string,
  options: CaptureOptions = {},
): Promise<void> {
  const opened = await openPage(url, options);
  try {
    if (options.prepare) await options.prepare(opened.page);
    if (options.stabilize ?? true) {
      await opened.page.emulateMedia({ reducedMotion: "reduce" });
      await opened.page.addStyleTag({
        content:
          "*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }",
      });
      await opened.page.evaluate("document.fonts ? document.fonts.ready : null");
    }
    await opened.page.screenshot({
      path: outPath,
      fullPage: options.fullPage ?? true,
      mask: options.mask?.map((selector) => opened.page.locator(selector)),
    });
  } finally {
    await closePage(opened);
  }
}

/** Opens `url` in a page, runs `fn` against it, and closes the browser afterwards — for scripted e2e/smoke flows. */
export async function withPage<T>(url: string, fn: (page: Page) => Promise<T>): Promise<T>;
export async function withPage<T>(
  url: string,
  options: PageOptions,
  fn: (page: Page) => Promise<T>,
): Promise<T>;
export async function withPage<T>(
  url: string,
  optionsOrFn: PageOptions | ((page: Page) => Promise<T>),
  maybeFn?: (page: Page) => Promise<T>,
): Promise<T> {
  const options = typeof optionsOrFn === "function" ? {} : optionsOrFn;
  const fn = typeof optionsOrFn === "function" ? optionsOrFn : maybeFn;
  if (!fn) throw new Error("withPage(url, options, fn) is missing its callback");

  const opened = await openPage(url, options);
  try {
    return await fn(opened.page);
  } finally {
    await closePage(opened);
  }
}
