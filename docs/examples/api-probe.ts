import type { FexContext } from "@fex/kit";

export const meta = {
  name: "api-probe",
  description: "GET a URL and optionally pluck a dot-path out of the JSON response",
};

export async function run(ctx: FexContext) {
  const [url, path] = ctx.args;
  if (!url) {
    ctx.log.error("Usage: fex api-probe <url> [dot.path]");
    return;
  }

  const data = await ctx.httpJson(url);
  console.log(JSON.stringify(path ? ctx.pick(data, path) : data, null, 2));
}
