import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { $, configPath, flowsDir, homeDir, intro, log, outro, scriptsDir, spinner } from "@fex/kit";

/** Package root of @fex/kit, resolved from wherever this CLI is actually running. */
function kitPackageDir(): string {
  const entry = Bun.resolveSync("@fex/kit", import.meta.dir);
  return dirname(dirname(entry)); // src/index.ts -> src -> package root
}

const TSCONFIG = `{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ESNext"],
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["scripts", "flows"]
}
`;

/**
 * Idempotent: each piece (dirs, config, package.json, tsconfig, install) is created
 * only if missing, so re-running `fex init` upgrades older ~/.fex layouts in place.
 */
export async function initCommand(): Promise<void> {
  intro("fex init");

  const dir = homeDir();
  let createdSomething = false;

  for (const sub of [scriptsDir(), flowsDir()]) {
    if (!existsSync(sub)) {
      await mkdir(sub, { recursive: true });
      createdSomething = true;
    }
  }

  if (!existsSync(configPath())) {
    await Bun.write(
      configPath(),
      '# fex config — see `fex run`\n# [pipelines]\n# preflight = ["env-diff", "vr test http://localhost:3000 --name app"]\n',
    );
    createdSomething = true;
  }

  // A package.json + tsconfig make ~/.fex a real TypeScript workspace: the editor
  // resolves `import type { FexContext } from "@fex/kit"` in scripts/, and flow files
  // can import runtime dependencies you `bun add` here.
  const pkgPath = join(dir, "package.json");
  if (!existsSync(pkgPath)) {
    const pkg = {
      name: "fex-home",
      private: true,
      type: "module",
      dependencies: {
        "@fex/kit": `file:${kitPackageDir()}`,
        "@types/bun": "latest",
      },
    };
    await Bun.write(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
    createdSomething = true;
  }

  const tsconfigPath = join(dir, "tsconfig.json");
  if (!existsSync(tsconfigPath)) {
    await Bun.write(tsconfigPath, TSCONFIG);
    createdSomething = true;
  }

  if (!existsSync(join(dir, "node_modules", "@fex", "kit"))) {
    const spin = spinner();
    spin.start("Installing @fex/kit into ~/.fex (for editor IntelliSense)");
    const result = await $`bun install`.cwd(dir).quiet().nothrow();
    if (result.exitCode === 0) {
      spin.stop("Installed @fex/kit");
    } else {
      spin.stop("Install failed — scripts still run, but the editor won't resolve @fex/kit");
      log.warn(`Run \`bun install\` in ${dir} manually to fix it.`);
    }
    createdSomething = true;
  }

  log.success(createdSomething ? `Ready at ${dir}` : `Already initialized at ${dir}`);
  outro(
    "Drop .ts scripts into scripts/ (and reusable step helpers into flows/) then run `fex list`.",
  );
}
