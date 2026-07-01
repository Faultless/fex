import * as browser from "./browser";
import { copy, paste } from "./clipboard";
import { findFiles, replaceInFiles } from "./files";
import { loadFlow } from "./flows";
import * as git from "./git";
import { http, httpJson, pick } from "./http";
import * as load from "./load";
import * as mock from "./mock";
import { $ } from "./shell";
import { intro, isCancel, log, note, outro, prompt, spinner } from "./ui";
import * as visual from "./visual";

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
