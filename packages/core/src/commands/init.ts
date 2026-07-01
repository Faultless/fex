import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { intro, log, outro } from "@fex/kit";
import { configPath, homeDir, scriptsDir } from "../paths";

export async function initCommand(): Promise<void> {
  intro("fex init");

  const dir = homeDir();

  if (existsSync(dir)) {
    log.info(`Already initialized at ${dir}`);
  } else {
    await mkdir(scriptsDir(), { recursive: true });
    await Bun.write(configPath(), '# fex config\n# [aliases]\n# foo = "bar"\n');
    log.success(`Created ${dir}`);
  }

  outro("Drop .ts scripts into scripts/ and run `fex list` to see them.");
}
