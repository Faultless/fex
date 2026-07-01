import { configPath } from "./paths";

export interface FexConfig {
  aliases?: Record<string, string>;
}

export async function loadConfig(): Promise<FexConfig> {
  const file = Bun.file(configPath());
  if (!(await file.exists())) return {};
  const text = await file.text();
  return Bun.TOML.parse(text) as FexConfig;
}
