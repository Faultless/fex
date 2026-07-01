import { expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { findFiles, replaceInFiles } from "./files";

function makeTree(): string {
  const dir = mkdtempSync(join(tmpdir(), "fex-files-"));
  mkdirSync(join(dir, "node_modules", "pkg"), { recursive: true });
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(join(dir, "node_modules", "pkg", "dep.ts"), "foo\n");
  writeFileSync(join(dir, "src", "app.ts"), "foo foo\n");
  return dir;
}

test("findFiles skips node_modules by default", async () => {
  const dir = makeTree();
  const files = await findFiles("**/*.ts", { cwd: dir });
  expect(files).toEqual(["src/app.ts"]);
});

test("findFiles scans node_modules with defaultIgnores: false", async () => {
  const dir = makeTree();
  const files = await findFiles("**/*.ts", { cwd: dir, defaultIgnores: false });
  expect(files.sort()).toEqual(["node_modules/pkg/dep.ts", "src/app.ts"]);
});

test("user ignore fragments still apply on top of the defaults", async () => {
  const dir = makeTree();
  const files = await findFiles("**/*.ts", { cwd: dir, ignore: ["app"] });
  expect(files).toEqual([]);
});

test("replaceInFiles never rewrites node_modules by default", async () => {
  const dir = makeTree();
  const changed = await replaceInFiles("**/*.ts", "foo", "bar", { cwd: dir });
  expect(changed).toEqual([{ file: "src/app.ts", replacements: 2 }]);
  expect(readFileSync(join(dir, "src", "app.ts"), "utf8")).toBe("bar bar\n");
  expect(readFileSync(join(dir, "node_modules", "pkg", "dep.ts"), "utf8")).toBe("foo\n");
});

test("replaceInFiles dryRun reports matches without writing", async () => {
  const dir = makeTree();
  const changed = await replaceInFiles("**/*.ts", "foo", "bar", { cwd: dir, dryRun: true });
  expect(changed).toEqual([{ file: "src/app.ts", replacements: 2 }]);
  expect(readFileSync(join(dir, "src", "app.ts"), "utf8")).toBe("foo foo\n");
});
