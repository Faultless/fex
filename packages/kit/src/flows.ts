import { existsSync } from "node:fs";
import { flowsDir } from "./home";

/**
 * The shape a flow file's default export must satisfy. Flow files live outside any
 * node_modules tree (they're dynamic-imported by absolute path from ~/.fex/flows), so
 * they can only use `@fex/kit` as a type (`import type`, `satisfies`) — a runtime
 * import from there would fail to resolve. Write `export default {...} satisfies
 * FlowSteps` rather than wrapping in a function.
 */
export type FlowSteps = Record<string, (...args: never[]) => Promise<unknown>>;

/**
 * Loads the named flow from `~/.fex/flows/<name>.ts` — see `fex new-flow`. Defaults to
 * `any` (like `JSON.parse`): a flow's real shape is defined by a file this call can't
 * see statically, and typing it as `Record<string, Fn>` would make every step call
 * fight `noUncheckedIndexedAccess`'s `| undefined`. Pass a concrete generic — e.g.
 * `ctx.loadFlow<{ login(page: Page): Promise<void> }>("myapp")` — if you want that
 * safety back for a specific flow.
 */
// biome-ignore lint/suspicious/noExplicitAny: shape is caller-defined, see doc comment above
export async function loadFlow<T = any>(name: string): Promise<T> {
  const path = `${flowsDir()}/${name}.ts`;
  if (!existsSync(path)) {
    throw new Error(
      `No flow named "${name}" in ${flowsDir()}. Run \`fex new-flow ${name}\` to create one.`,
    );
  }
  const mod = (await import(path)) as { default?: T };
  if (!mod.default) {
    throw new Error(
      `${path} must have a default export — \`export default {...} satisfies FlowSteps\`.`,
    );
  }
  return mod.default;
}
