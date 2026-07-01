import { afterEach, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { discoverScripts } from "./discovery";

const GOOD_SCRIPT = `export const meta = { name: "good", description: "a working script" };
export async function run() {}
`;

function makeHome(): string {
  const home = mkdtempSync(join(tmpdir(), "fex-home-"));
  mkdirSync(join(home, "scripts"), { recursive: true });
  process.env.FEX_HOME = home;
  return home;
}

afterEach(() => {
  // biome-ignore lint/performance/noDelete: assigning undefined would store the string "undefined"
  delete process.env.FEX_HOME;
});

test("a broken script is skipped instead of crashing discovery", async () => {
  const home = makeHome();
  writeFileSync(join(home, "scripts", "good.ts"), GOOD_SCRIPT);
  writeFileSync(join(home, "scripts", "broken.ts"), "this is not valid typescript {{{\n");

  const { scripts, skipped } = await discoverScripts();

  expect(scripts.map((script) => script.meta.name)).toEqual(["good"]);
  expect(skipped).toHaveLength(1);
  expect(skipped[0]?.file).toEndWith("broken.ts");
});

test("a script without meta/run exports is skipped with a reason", async () => {
  const home = makeHome();
  writeFileSync(join(home, "scripts", "bare.ts"), "export const nothing = true;\n");

  const { scripts, skipped } = await discoverScripts();

  expect(scripts).toHaveLength(0);
  expect(skipped[0]?.reason).toContain("meta");
});

test("unchanged scripts are served from the manifest cache, not re-imported", async () => {
  const home = makeHome();
  writeFileSync(join(home, "scripts", "good.ts"), GOOD_SCRIPT);

  await discoverScripts();

  // Tamper with the cached description; mtime is unchanged, so a second discovery
  // must trust the manifest instead of importing the file again.
  const manifestPath = join(home, ".manifest.json");
  const manifest = await Bun.file(manifestPath).json();
  manifest["good.ts"].meta.description = "from-the-cache";
  writeFileSync(manifestPath, JSON.stringify(manifest));

  const { scripts } = await discoverScripts();
  expect(scripts[0]?.meta.description).toBe("from-the-cache");
});
