import { existsSync } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { homeDir, scriptsDir } from "./home";
import type { ScriptMeta, ScriptModule } from "./types";

export interface DiscoveredScript {
  file: string;
  meta: ScriptMeta;
}

export interface SkippedScript {
  file: string;
  reason: string;
}

export interface DiscoveryResult {
  scripts: DiscoveredScript[];
  skipped: SkippedScript[];
}

interface ManifestEntry {
  mtimeMs: number;
  meta?: ScriptMeta;
  error?: string;
}

type Manifest = Record<string, ManifestEntry>;

function manifestPath(): string {
  return join(homeDir(), ".manifest.json");
}

async function readManifest(): Promise<Manifest> {
  try {
    const file = Bun.file(manifestPath());
    if (!(await file.exists())) return {};
    return (await file.json()) as Manifest;
  } catch {
    return {};
  }
}

async function importMeta(path: string): Promise<{ meta?: ScriptMeta; error?: string }> {
  try {
    const mod = (await import(path)) as Partial<ScriptModule>;
    if (!mod.meta?.name || typeof mod.run !== "function") {
      return { error: 'missing "meta" or "run" export' };
    }
    return { meta: { name: mod.meta.name, description: mod.meta.description ?? "" } };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { error: message.split("\n")[0] || "failed to import" };
  }
}

/**
 * Lists ~/.fex/scripts without importing unchanged files: metadata is cached in
 * ~/.fex/.manifest.json keyed by mtime, so a script's top-level code runs once per
 * edit rather than on every `fex` invocation. A script that fails to import (syntax
 * error, bad exports) lands in `skipped` instead of crashing every command.
 */
export async function discoverScripts(): Promise<DiscoveryResult> {
  const dir = scriptsDir();
  if (!existsSync(dir)) return { scripts: [], skipped: [] };

  const entries = await readdir(dir, { withFileTypes: true });
  const manifest = await readManifest();
  const next: Manifest = {};
  const scripts: DiscoveredScript[] = [];
  const skipped: SkippedScript[] = [];
  let dirty = false;

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".ts")) continue;
    const path = join(dir, entry.name);
    const { mtimeMs } = await stat(path);

    const cached = manifest[entry.name];
    let record = cached && cached.mtimeMs === mtimeMs ? cached : undefined;
    if (!record) {
      record = { mtimeMs, ...(await importMeta(path)) };
      dirty = true;
    }

    next[entry.name] = record;
    if (record.meta) {
      scripts.push({ file: path, meta: record.meta });
    } else {
      skipped.push({ file: path, reason: record.error ?? "unknown error" });
    }
  }

  if (dirty || Object.keys(next).length !== Object.keys(manifest).length) {
    await Bun.write(manifestPath(), JSON.stringify(next, null, 2));
  }

  return { scripts, skipped };
}
