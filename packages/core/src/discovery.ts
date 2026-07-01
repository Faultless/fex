import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import type { ScriptModule } from "@fex/kit";
import { scriptsDir } from "./paths";

export interface DiscoveredScript extends ScriptModule {
  file: string;
}

export async function discoverScripts(): Promise<DiscoveredScript[]> {
  const dir = scriptsDir();
  if (!existsSync(dir)) return [];

  const entries = await readdir(dir, { withFileTypes: true });
  const scripts: DiscoveredScript[] = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".ts")) continue;
    const path = `${dir}/${entry.name}`;
    const mod = (await import(path)) as Partial<ScriptModule>;
    if (!mod.meta || !mod.run) {
      console.warn(`Skipping ${entry.name}: missing "meta" or "run" export`);
      continue;
    }
    scripts.push({ meta: mod.meta, run: mod.run, file: path });
  }

  return scripts;
}
