# Examples

Real, working scripts — copy any of them into `~/.fex/scripts/` and they show up as a
`fex <name>` subcommand immediately (no build step). Each is typechecked against
`@fex/kit` as part of this repo (`bunx tsc --noEmit -p docs/examples/tsconfig.json`).

| Script | What it does |
| --- | --- |
| [`env-diff.ts`](./env-diff.ts) | Lists keys in `.env.example` missing from `.env`, so `astro dev`/`vite dev` doesn't fail cryptically. |
| [`api-probe.ts`](./api-probe.ts) | `fex api-probe <url> [dot.path]` — GET a URL and optionally pluck a value out of the JSON, instead of hand-typing curl+jq. |
| [`content-lint.ts`](./content-lint.ts) | Flags Astro content-collection files under `src/content/` missing a `title:` in frontmatter. |
| [`asset-report.ts`](./asset-report.ts) | Sizes every 3D/texture asset under `public/` (`.glb`/`.gltf`/images), flags anything over 2MB — catches bloated Three.js assets before they ship. |
| [`flutter-fresh.ts`](./flutter-fresh.ts) | `flutter clean && flutter pub get && flutter build <target>` with a spinner, for whichever Flutter side project you're in. |
| [`pubspec-bump.ts`](./pubspec-bump.ts) | Bumps the patch version in `pubspec.yaml` in place. |
| [`publish-checklist.ts`](./publish-checklist.ts) | Guided lint → typecheck → build → version-bump → publish flow for a TS library, with confirm gates before anything irreversible. |
| [`component-scaffold.ts`](./component-scaffold.ts) | `fex component-scaffold <Name>` — scaffolds a MUI-flavored component + RTL test under `src/components/`. |
| [`scene-scaffold.ts`](./scene-scaffold.ts) | `fex scene-scaffold <name>` — scaffolds a Three.js scene module (camera, renderer, animation loop). |

These are starting points, not a fixed API — the point of `fex` is that editing one of
these is just editing a TypeScript file, same as any other script in your project.
