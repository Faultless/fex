import { afterEach, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runScript } from "./context";

function makeHome(): string {
  const home = mkdtempSync(join(tmpdir(), "fex-ctx-"));
  mkdirSync(join(home, "scripts"), { recursive: true });
  process.env.FEX_HOME = home;
  return home;
}

afterEach(() => {
  // biome-ignore lint/performance/noDelete: assigning undefined would store the string "undefined"
  delete process.env.FEX_HOME;
});

test("runScript dispatches by meta.name and forwards args", async () => {
  const home = makeHome();
  const marker = join(home, "marker.txt");
  writeFileSync(
    join(home, "scripts", "child.ts"),
    `export const meta = { name: "child", description: "writes a marker" };
export async function run(ctx) { await Bun.write(ctx.args[0], "ran " + ctx.args[1]); }
`,
  );

  await runScript("child", [marker, "ok"]);
  expect(await Bun.file(marker).text()).toBe("ran ok");
});

test("runScript throws for a script that doesn't exist", async () => {
  makeHome();
  await expect(runScript("ghost")).rejects.toThrow('No script named "ghost"');
});

test("runScript refuses to recurse into a script that is already running", async () => {
  const home = makeHome();
  writeFileSync(
    join(home, "scripts", "loop.ts"),
    `export const meta = { name: "loop", description: "calls itself" };
export async function run(ctx) { await ctx.runScript("loop"); }
`,
  );

  await expect(runScript("loop")).rejects.toThrow("Script cycle: loop -> loop");
});
