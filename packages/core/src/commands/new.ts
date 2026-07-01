import { existsSync } from "node:fs";
import { intro, isCancel, log, outro, prompt, scriptsDir } from "@fex/kit";

function template(name: string, description: string): string {
  return `import type { FexContext } from "@fex/kit";

export const meta = {
  name: "${name}",
  description: "${description}",
};

export async function run(ctx: FexContext) {
  ctx.log.info("Hello from ${name}!");
}
`;
}

async function textPrompt(message: string, initialValue = ""): Promise<string> {
  const value = await prompt.text({ message, initialValue });
  if (isCancel(value)) {
    process.exit(1);
  }
  return value as string;
}

export async function newCommand(nameArg?: string): Promise<void> {
  intro("fex new");

  const dir = scriptsDir();
  if (!existsSync(dir)) {
    log.error("Run `fex init` first.");
    process.exitCode = 1;
    return;
  }

  const name = nameArg ?? (await textPrompt("Script name?"));
  const path = `${dir}/${name}.ts`;
  if (existsSync(path)) {
    log.error(`${path} already exists.`);
    process.exitCode = 1;
    return;
  }

  const description = await textPrompt("One-line description?");

  await Bun.write(path, template(name, description));
  log.success(`Created ${path}`);
  outro(`Run it with: fex ${name}`);
}
