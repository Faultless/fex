import { $ } from "./shell";

export async function currentBranch(): Promise<string> {
  return (await $`git rev-parse --abbrev-ref HEAD`.text()).trim();
}

export async function isClean(): Promise<boolean> {
  const status = await $`git status --porcelain`.text();
  return status.trim().length === 0;
}

export async function changedFiles(): Promise<string[]> {
  const output = await $`git diff --name-only HEAD`.text();
  return output.split("\n").filter(Boolean);
}
