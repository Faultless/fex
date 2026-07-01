import { $, intro, isCancel, log, outro, prompt } from "@fex/kit";

export async function portCommand(portArg: string): Promise<void> {
  intro("fex port");

  const port = Number(portArg);
  if (!port) {
    log.error("Usage: fex port <number>");
    process.exitCode = 1;
    return;
  }

  try {
    const result = await $`lsof -i :${port} -sTCP:LISTEN -t`.quiet().nothrow();
    const pids = result.stdout.toString().trim().split("\n").filter(Boolean);

    if (pids.length === 0) {
      log.info(`Nothing is listening on port ${port}.`);
    } else {
      log.info(`Port ${port} is held by PID(s): ${pids.join(", ")}`);
      const confirmed = await prompt.confirm({
        message: `Kill ${pids.length === 1 ? "it" : "them"}?`,
      });
      if (isCancel(confirmed)) process.exit(1);

      if (confirmed) {
        for (const pid of pids) await $`kill -9 ${pid}`;
        log.success(`Killed PID(s): ${pids.join(", ")}`);
      } else {
        log.info("Left it running.");
      }
    }
  } catch (error) {
    log.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }

  outro("done");
}
