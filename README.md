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
  them as subcommands, and ships `init`/`new`/`new-flow`/`list`/`screenshot-diff`/`vr`/
  `har`/`load`/`mock`/`port` built-ins.
- **`packages/kit`** (`@fex/kit`) — the SDK every script imports: shell (`$`, via Bun's
  native shell), file globbing/find-replace, a `fetch` wrapper with presets and a
  jq-lite path picker, clipboard, git helpers, `@clack/prompts`-based UI, and opt-in
  browser automation / visual diffing / load testing / mock data generation (see below).

## Quickstart

```sh
bun install
bun packages/core/src/cli.ts init      # creates ~/.fex/{config.toml,scripts/,flows/}
bun packages/core/src/cli.ts new       # interactive: scaffold a script
bun packages/core/src/cli.ts list      # see what's discovered
bun packages/core/src/cli.ts <name>    # run one
```

Once linked globally (`bun link` from `packages/core`), all of the above drop the
`bun packages/core/src/cli.ts` prefix and become `fex init`, `fex new`, etc.

`init` also gives `~/.fex` its own `package.json` + `tsconfig.json` and installs
`@fex/kit` there, so your editor resolves `import type { FexContext } from "@fex/kit"`
inside `scripts/` and `flows/` — autocomplete works in the directory you actually write
code in. Scripts are only (re)imported when their file changes; a script with a syntax
error is skipped with a warning instead of taking down every command.

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
`pick`, `clipboard.copy`/`paste`, `git.*`, `log`/`spinner`/`note`/`prompt.*`, `args`
(anything passed after the script name on the command line), and `runScript(name, args)`
to call another script like a function.

## Examples

[`docs/examples/`](./docs/examples) has real, working starter scripts (env diffing, API
probing, Astro content linting, Three.js asset auditing, Flutter build helpers, a guided
publish checklist, MUI/Three.js scaffolders, an e2e smoke check) — copy any of them into
`~/.fex/scripts/` to try it.

## Testing & data built-ins

These are peer-dependency features — the underlying library only installs if you use
it, so a bare `fex` install stays light.

| Command | Backs onto | What it's for |
| --- | --- | --- |
| `fex screenshot-diff <before> <after>` | Playwright + pixelmatch | One-off pixel diff: pass two URLs (captured live) or two PNG paths, get a diff ratio and a diff image. `bun add -D playwright pixelmatch pngjs @types/pngjs && bunx playwright install chromium` |
| `fex vr update\|test <url>` | Playwright + pixelmatch | Baseline visual regression: `update` stores screenshots under `~/.fex/baselines/<name>/`, `test` re-captures and fails on drift. Supports a viewport matrix (`--viewports mobile,desktop`), `--dark`, `--mask "sel1,sel2"` for volatile elements, and `--flow app:login` to capture authenticated pages. Same deps as `screenshot-diff`. |
| `fex har record\|replay <url>` | Playwright | Record API traffic into a HAR while you click around a headed browser, then replay it later — work on the frontend with the backend down. `--filter` scopes which requests are captured/served (default `**/api/**`). |
| `fex load <url>` | autocannon | Quick stress test: req/s, p50/p97.5/p99 latency. `bun add -D autocannon` |
| `fex mock [count]` | @faker-js/faker | Guided wizard or `--from sample.json` shape-inference to generate fixtures/MSW-ready data. `bun add -D @faker-js/faker` |
| `fex port <number>` | none (built-in) | Find what's listening on a port, optionally kill it. |

For app-specific e2e flows (login, multi-step forms, checkout), `ctx.browser.withPage`
is the low-level primitive — see [Flows](./docs/examples#flows-reusable-step-helpers-for-your-app)
in the examples doc for how `fex new-flow` gives you a place to write reusable click
sequences once instead of re-deriving them in every script.

## Config & pipelines

`~/.fex/config.toml` (parsed with Bun's native TOML parser) holds named **pipelines**:
sequences of fex command lines — built-ins and your scripts alike — that `fex run <name>`
executes in order, stopping at the first non-zero exit:

```toml
[pipelines]
preflight = ["env-diff", "vr test http://localhost:3000 --name app"]
```

Override the home directory with the `FEX_HOME` environment variable (useful for
testing).
