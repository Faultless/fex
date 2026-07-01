import { log } from "@fex/kit";
import { discoverScripts } from "../discovery";

export async function listCommand(): Promise<void> {
  const scripts = await discoverScripts();
  if (scripts.length === 0) {
    log.info("No scripts found. Run `fex new <name>` to create one.");
    return;
  }
  for (const script of scripts) {
    console.log(`  ${script.meta.name.padEnd(20)} ${script.meta.description}`);
  }
}
