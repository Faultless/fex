# fex

A frontend developer's scriptable toolbox. `fex` gives you a `~/.fex/scripts/` directory
where you drop small TypeScript files, and it turns each one into a CLI subcommand —
no build step, no boilerplate, no copy-pasting the same curl/grep/sed one-liner for the
tenth time.

## Why

Daily frontend chores (poke an API, bulk-rename across files, check bundle size, tail a
build log) usually mean either re-typing shell one-liners you never remember the flags
for, or burning LLM tokens on the same script every time. `fex` is the middle path:
write it once as a tiny TypeScript script, and it's a permanent, discoverable command.

## Packages

- **`packages/core`** — the `fex` CLI: discovers scripts in `~/.fex/scripts`, registers
  them as subcommands, and ships `init`/`new`/`list` built-ins.
- **`packages/kit`** (`@fex/kit`) — the SDK every script imports: shell (`$`, via Bun's
  native shell), file globbing/find-replace, a `fetch` wrapper with presets and a
  jq-lite path picker, clipboard, git helpers, and `@clack/prompts`-based UI.

## Quickstart

```sh
bun install
bun packages/core/src/cli.ts init      # creates ~/.fex/{config.toml,scripts/}
bun packages/core/src/cli.ts new       # interactive: scaffold a script
bun packages/core/src/cli.ts list      # see what's discovered
bun packages/core/src/cli.ts <name>    # run one
```

Once linked globally (`bun link` from `packages/core`), all of the above drop the
`bun packages/core/src/cli.ts` prefix and become `fex init`, `fex new`, etc.

## Writing a script

Every file in `~/.fex/scripts/*.ts` exports `meta` and `run`:

```ts
import type { FexContext } from "@fex/kit";

export const meta = {
  name: "check-bundle",
  description: "print the size of dist/ after a build",
};

export async function run(ctx: FexContext) {
  await ctx.$`bun run build`;
  await ctx.$`du -sh dist/`;
}
```

`ctx` is the `@fex/kit` SDK: `$` (shell), `findFiles`/`replaceInFiles`, `http`/`httpJson`/
`pick`, `clipboard.copy`/`paste`, `git.*`, `log`/`spinner`/`note`/`prompt.*`, and `args`
(anything passed after the script name on the command line).

## Examples

[`docs/examples/`](./docs/examples) has real, working starter scripts (env diffing, API
probing, Astro content linting, Three.js asset auditing, Flutter build helpers, a guided
publish checklist, MUI/Three.js scaffolders) — copy any of them into `~/.fex/scripts/`
to try it.

## Config

`~/.fex/config.toml` is read by `@fex/kit`'s config loader (via Bun's native TOML
parser) for things like saved HTTP presets or aliases. Override the home directory
with the `FEX_HOME` environment variable (useful for testing).
