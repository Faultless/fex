import { configPath, intro, log, outro } from "@fex/kit";
import { loadConfig } from "../config";

const EXAMPLE = `[pipelines]
preflight = ["env-diff", "vr test http://localhost:3000 --name app"]`;

/**
 * Runs each step as a `fex ...` subprocess so built-ins and user scripts compose
 * uniformly, exit codes decide pass/fail, and one step's process state (exitCode,
 * clack UI) can't bleed into the next. FEX_PIPELINE_STACK guards against pipelines
 * that `run` each other in a cycle.
 */
export async function runCommand(name: string): Promise<void> {
  intro(`fex run ${name}`);

  const config = await loadConfig();
  const pipelines = config.pipelines ?? {};
  const steps = pipelines[name];

  if (!Array.isArray(steps) || steps.length === 0) {
    const available = Object.keys(pipelines);
    log.error(
      available.length > 0
        ? `No pipeline "${name}" in ${configPath()}. Available: ${available.join(", ")}`
        : `No pipeline "${name}" — define one in ${configPath()}:\n\n${EXAMPLE}`,
    );
    process.exitCode = 1;
    outro("done");
    return;
  }

  const stack = (process.env.FEX_PIPELINE_STACK ?? "").split(",").filter(Boolean);
  if (stack.includes(name)) {
    log.error(`Pipeline cycle: ${[...stack, name].join(" -> ")}`);
    process.exitCode = 1;
    outro("done");
    return;
  }

  for (const [index, step] of steps.entries()) {
    log.step(`[${index + 1}/${steps.length}] fex ${step}`);
    const argv = step.split(/\s+/).filter(Boolean);
    const proc = Bun.spawn([process.execPath, Bun.main, ...argv], {
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit",
      env: { ...process.env, FEX_PIPELINE_STACK: [...stack, name].join(",") },
    });
    const code = await proc.exited;
    if (code !== 0) {
      log.error(`Step "fex ${step}" failed (exit ${code}) — stopping the pipeline.`);
      process.exitCode = code;
      outro(`Failed at step ${index + 1}/${steps.length}`);
      return;
    }
  }

  outro(`All ${steps.length} step(s) passed`);
}
