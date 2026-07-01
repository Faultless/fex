import { discoverScripts, log } from "@fex/kit";

export async function listCommand(): Promise<void> {
  const { scripts, skipped } = await discoverScripts();

  if (scripts.length === 0 && skipped.length === 0) {
    log.info("No scripts found. Run `fex new <name>` to create one.");
    return;
  }

  const pad = Math.max(20, ...scripts.map((script) => script.meta.name.length + 2));
  for (const script of scripts) {
    console.log(`  ${script.meta.name.padEnd(pad)} ${script.meta.description}`);
  }
  for (const entry of skipped) {
    log.warn(`broken: ${entry.file} — ${entry.reason}`);
  }
}
