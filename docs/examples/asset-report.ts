import type { FexContext } from "@fex/kit";

export const meta = {
  name: "asset-report",
  description: "report sizes of 3D/texture assets under public/, flag anything over 2MB",
};

const THRESHOLD_BYTES = 2 * 1024 * 1024;

export async function run(ctx: FexContext) {
  const files = await ctx.findFiles("public/**/*.{glb,gltf,png,jpg,jpeg,webp,ktx2}");
  if (files.length === 0) {
    ctx.log.info("No matching assets found under public/.");
    return;
  }

  const sized = files
    .map((file) => ({ file, size: Bun.file(file).size }))
    .sort((a, b) => b.size - a.size);

  for (const { file, size } of sized) {
    const mb = (size / (1024 * 1024)).toFixed(2);
    const flag = size > THRESHOLD_BYTES ? "  ⚠ over 2MB" : "";
    console.log(`  ${mb.padStart(8)} MB  ${file}${flag}`);
  }
}
