import type { FexContext } from "@fex/kit";

export const meta = {
  name: "env-diff",
  description: "list keys present in .env.example but missing from .env",
};

export async function run(ctx: FexContext) {
  const exampleFile = Bun.file(".env.example");
  if (!(await exampleFile.exists())) {
    ctx.log.error("No .env.example in the current directory.");
    return;
  }

  const envFile = Bun.file(".env");
  const exampleKeys = parseKeys(await exampleFile.text());
  const envKeys = (await envFile.exists()) ? parseKeys(await envFile.text()) : new Set<string>();

  const missing = [...exampleKeys].filter((key) => !envKeys.has(key));

  if (missing.length === 0) {
    ctx.log.success(".env has every key from .env.example.");
    return;
  }

  ctx.log.warn(`Missing ${missing.length} key(s):`);
  for (const key of missing) console.log(`  - ${key}`);
}

function parseKeys(content: string): Set<string> {
  const keys = new Set<string>();
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key] = trimmed.split("=");
    if (key) keys.add(key.trim());
  }
  return keys;
}
