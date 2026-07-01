import type { FexContext } from "@fex/kit";

export const meta = {
  name: "e2e-smoke",
  description: "golden-path smoke check, composed from a named flow (see fex new-flow)",
};

export async function run(ctx: FexContext) {
  const [url = "http://localhost:3000", flowName = "checkoutFlow"] = ctx.args;

  const app = await ctx.loadFlow(flowName);

  await ctx.browser.withPage(url, async (page) => {
    await app.clickThroughSteps(page);
    await app.fillDimensionStep(page, ["10", "20", "30"]);
    ctx.log.success(`${flowName} completed against ${url} without throwing.`);
  });
}
