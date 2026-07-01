import type { FexContext } from "@fex/kit";

export const meta = {
  name: "pubspec-bump",
  description: "bump the patch version in pubspec.yaml",
};

export async function run(ctx: FexContext) {
  const text = await Bun.file("pubspec.yaml").text();
  const match = text.match(/^version:\s*(\d+)\.(\d+)\.(\d+)(\+\d+)?/m);
  if (!match) {
    ctx.log.error("Couldn't find a version: line in pubspec.yaml");
    return;
  }

  const [full, major, minor, patch, build] = match;
  const nextVersion = `${major}.${minor}.${Number(patch) + 1}${build ?? ""}`;
  const results = await ctx.replaceInFiles("pubspec.yaml", full, `version: ${nextVersion}`);
  ctx.log.success(`Bumped to ${nextVersion} (${results[0]?.replacements ?? 0} replacement(s)).`);
}
