import { copy, paste } from "./clipboard";
import { findFiles, replaceInFiles } from "./files";
import * as git from "./git";
import { http, httpJson, pick } from "./http";
import { $ } from "./shell";
import { intro, isCancel, log, note, outro, prompt, spinner } from "./ui";

export interface FexContext {
  $: typeof $;
  findFiles: typeof findFiles;
  replaceInFiles: typeof replaceInFiles;
  http: typeof http;
  httpJson: typeof httpJson;
  pick: typeof pick;
  clipboard: { copy: typeof copy; paste: typeof paste };
  git: typeof git;
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
