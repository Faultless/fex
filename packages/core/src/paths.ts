import { homedir } from "node:os";
import { join } from "node:path";

export function homeDir(): string {
  return process.env.FEX_HOME ?? join(homedir(), ".fex");
}

export function scriptsDir(): string {
  return join(homeDir(), "scripts");
}

export function configPath(): string {
  return join(homeDir(), "config.toml");
}
