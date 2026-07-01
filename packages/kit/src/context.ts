import * as browser from "./browser";
import { copy, paste } from "./clipboard";
import { discoverScripts } from "./discovery";
import { findFiles, replaceInFiles } from "./files";
import { loadFlow } from "./flows";
import * as git from "./git";
import { scriptsDir } from "./home";
import { http, httpJson, pick } from "./http";
import * as load from "./load";
import * as mock from "./mock";
import { $ } from "./shell";
import type { ScriptModule } from "./types";
import { intro, isCancel, log, note, outro, prompt, spinner } from "./ui";
import * as visual from "./visual";

const scriptStack: string[] = [];

/**
 * Runs another fex script by its `meta.name`, in-process, with a fresh context —
 * scripts composing scripts. Throws if the script doesn't exist or if the call
 * would recurse into a script that is already running.
 */
export async function runScript(name: string, args: string[] = []): Promise<void> {
  if (scriptStack.includes(name)) {
    throw new Error(`Script cycle: ${[...scriptStack, name].join(" -> ")}`);
  }
  const { scripts } = await discoverScripts();
  const script = scripts.find((entry) => entry.meta.name === name);
  if (!script) {
    throw new Error(`No script named "${name}" in ${scriptsDir()}.`);
  }
  const mod = (await import(script.file)) as Partial<ScriptModule>;
  if (typeof mod.run !== "function") {
    throw new Error(`${script.file} does not export a "run" function.`);
  }
  scriptStack.push(name);
  try {
    await mod.run(createContext(args));
  } finally {
    scriptStack.pop();
  }
}

export interface FexContext {
  $: typeof $;
  findFiles: typeof findFiles;
  replaceInFiles: typeof replaceInFiles;
  http: typeof http;
  httpJson: typeof httpJson;
  pick: typeof pick;
  clipboard: { copy: typeof copy; paste: typeof paste };
  git: typeof git;
  /** Playwright-backed: capture(url, outPath) / withPage(url, fn). Peer dep — see @fex/kit/browser. */
  browser: typeof browser;
  /** pixelmatch-backed screenshot diffing. Peer dep — see @fex/kit/visual. */
  visual: typeof visual;
  /** autocannon-backed load testing. Peer dep — see @fex/kit/load. */
  load: typeof load;
  /** faker-backed mock data generation. Peer dep — see @fex/kit/mock. */
  mock: typeof mock;
  /** Loads a named flow of reusable step functions from ~/.fex/flows/<name>.ts. */
  loadFlow: typeof loadFlow;
  /** Runs another script by meta.name with its own context — compose scripts like functions. */
  runScript: typeof runScript;
  log: typeof log;
  spinner: typeof spinner;
  note: typeof note;
  intro: typeof intro;
  outro: typeof outro;
  isCancel: typeof isCancel;
  prompt: typeof prompt;
  /** Positional CLI arguments passed after the script name. */
  args: string[];
}

export function createContext(args: string[] = []): FexContext {
  return {
    $,
    findFiles,
    replaceInFiles,
    http,
    httpJson,
    pick,
    clipboard: { copy, paste },
    git,
    browser,
    visual,
    load,
    mock,
    loadFlow,
    runScript,
    log,
    spinner,
    note,
    intro,
    outro,
    isCancel,
    prompt,
    args,
  };
}
