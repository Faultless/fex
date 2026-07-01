import type { FexContext } from "@fex/kit";

export const meta = {
  name: "content-lint",
  description: "flag Astro content-collection files missing a title in frontmatter",
};

export async function run(ctx: FexContext) {
  const files = await ctx.findFiles("src/content/**/*.{md,mdx}");
  if (files.length === 0) {
    ctx.log.info("No content files found under src/content.");
    return;
  }

  const offenders: string[] = [];
  for (const file of files) {
    const frontmatter = (await Bun.file(file).text()).split("---")[1] ?? "";
    if (!/^title:/m.test(frontmatter)) offenders.push(file);
  }

  if (offenders.length === 0) {
    ctx.log.success(`All ${files.length} content file(s) have a title.`);
    return;
  }

  ctx.log.warn(`${offenders.length} file(s) missing "title:" in frontmatter:`);
  for (const file of offenders) console.log(`  - ${file}`);
}
