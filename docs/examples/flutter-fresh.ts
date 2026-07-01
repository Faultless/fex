import type { FexContext } from "@fex/kit";

export const meta = {
  name: "flutter-fresh",
  description: "flutter clean + pub get + build for the given target (default: apk)",
};

export async function run(ctx: FexContext) {
  const [target = "apk"] = ctx.args;
  const spin = ctx.spinner();

  spin.start("flutter clean");
  await ctx.$`flutter clean`.quiet();

  spin.message("flutter pub get");
  await ctx.$`flutter pub get`.quiet();

  spin.message(`flutter build ${target}`);
  await ctx.$`flutter build ${target}`;

  spin.stop(`Built ${target}.`);
}
