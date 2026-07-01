import type { FexContext } from "@fex/kit";

export const meta = {
  name: "publish-checklist",
  description: "guided lint -> typecheck -> build -> publish flow for a TS library",
};

export async function run(ctx: FexContext) {
  ctx.intro("publish-checklist");

  const steps = [
    { label: "lint", cmd: () => ctx.$`bun run lint` },
    { label: "typecheck", cmd: () => ctx.$`bun run typecheck` },
    { label: "build", cmd: () => ctx.$`bun run build` },
  ];

  for (const step of steps) {
    const spin = ctx.spinner();
    spin.start(step.label);
    try {
      await step.cmd();
      spin.stop(`${step.label} passed`);
    } catch (error) {
      spin.stop(`${step.label} failed`);
      ctx.log.error(String(error));
      return;
    }
  }

  const bump = await ctx.prompt.select({
    message: "Version bump?",
    options: [
      { value: "patch", label: "patch" },
      { value: "minor", label: "minor" },
      { value: "major", label: "major" },
    ],
  });
  if (ctx.isCancel(bump)) return;

  const confirmed = await ctx.prompt.confirm({ message: `Publish after bumping ${bump}?` });
  if (ctx.isCancel(confirmed) || !confirmed) {
    ctx.outro("Cancelled before publish.");
    return;
  }

  await ctx.$`npm version ${bump}`;
  await ctx.$`npm publish`;
  ctx.outro("Published.");
}
