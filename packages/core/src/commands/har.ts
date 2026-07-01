import { existsSync } from "node:fs";
import { browser, intro, isCancel, log, outro, prompt } from "@fex/kit";

export interface HarOptions {
  file: string;
  filter: string;
}

export async function harCommand(action: string, url: string, options: HarOptions): Promise<void> {
  intro(`fex har ${action}`);

  try {
    if (action !== "record" && action !== "replay") {
      throw new Error(`Unknown action "${action}" — use \`har record\` or \`har replay\`.`);
    }
    const mode = action;
    if (mode === "replay" && !existsSync(options.file)) {
      throw new Error(`${options.file} does not exist — record one first with \`fex har record\`.`);
    }

    log.info(
      mode === "record"
        ? `Recording requests matching ${options.filter} into ${options.file}`
        : `Serving requests matching ${options.filter} from ${options.file} instead of the network`,
    );

    await browser.withPage(
      url,
      { headed: true, har: { path: options.file, mode, urlFilter: options.filter } },
      async () => {
        const answer = await prompt.text({
          message:
            mode === "record"
              ? "Browse the app in the Chromium window, then press Enter here to stop and save."
              : "Browse the app (matching API calls come from the HAR), then press Enter to finish.",
        });
        if (isCancel(answer)) log.info("Cancelled — closing the browser.");
      },
    );

    if (mode === "record") log.success(`Saved ${options.file}`);
  } catch (error) {
    log.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }

  outro("done");
}
