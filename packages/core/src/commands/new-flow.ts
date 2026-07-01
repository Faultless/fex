import { existsSync } from "node:fs";
import { flowsDir, intro, isCancel, log, outro, prompt } from "@fex/kit";

function template(name: string): string {
  return `// A flow is just an object of named, reusable Playwright step functions for
// this one app — write the selectors/click-sequences once, reuse them from any
// script via \`ctx.loadFlow("${name}")\`. No import needed here: flow files live
// outside node_modules resolution, so stick to plain objects (or \`import type\`).

export default {
  async clickThroughSteps(page) {
    await page.click("#step-1");
    await page.click("#step-2");
    await page.click("#confirm");
  },

  async fillDimensionStep(page, values) {
    for (const [index, value] of values.entries()) {
      await page.fill(\`#dimension-\${index}\`, value);
    }
  },
};
`;
}

export async function newFlowCommand(nameArg?: string): Promise<void> {
  intro("fex new-flow");

  const dir = flowsDir();
  if (!existsSync(dir)) {
    log.error("Run `fex init` first.");
    process.exitCode = 1;
    return;
  }

  const name =
    nameArg ??
    (await (async () => {
      const value = await prompt.text({ message: "Flow name? (usually the app it drives)" });
      if (isCancel(value)) process.exit(1);
      return value as string;
    })());

  const path = `${dir}/${name}.ts`;
  if (existsSync(path)) {
    log.error(`${path} already exists.`);
    process.exitCode = 1;
    return;
  }

  await Bun.write(path, template(name));
  log.success(`Created ${path}`);
  outro(`Use it from any script with: await ctx.loadFlow("${name}")`);
}
