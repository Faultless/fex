import type { FexContext } from "./context";

export interface ScriptMeta {
  name: string;
  description: string;
}

export interface ScriptModule {
  meta: ScriptMeta;
  run: (ctx: FexContext) => Promise<void> | void;
}
