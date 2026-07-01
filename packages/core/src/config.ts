import { configPath } from "@fex/kit";

export interface FexConfig {
  /**
   * Named sequences of fex invocations, run in order by `fex run <name>`, stopping at
   * the first failure. Each step is a fex command line without the leading "fex" —
   * built-ins and user scripts alike:
   *
   *   [pipelines]
   *   preflight = ["env-diff", "vr test http://localhost:3000 --name app", "load-budget"]
   */
  pipelines?: Record<string, string[]>;
}

export async function loadConfig(): Promise<FexConfig> {
  const file = Bun.file(configPath());
  if (!(await file.exists())) return {};
  const text = await file.text();
  return Bun.TOML.parse(text) as FexConfig;
}
