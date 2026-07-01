import { homedir } from "node:os";
import { join } from "node:path";
import type { FexContext } from "@fex/kit";

export const meta = {
  name: "preflight",
  description: "diff-aware pre-push gate: visual check for UI changes, latency budget for API",
};

// Which changed paths trigger which judge. Tune these to your repo's layout.
const UI_PATTERNS = [/\.(tsx|jsx|css|scss|vue|svelte)$/i];
const API_PATTERNS = [/(^|\/)(api|server|routes)\//i];

const FAIL_RATIO = 0.01; // allow 1% pixel drift before failing the visual gate

export async function run(ctx: FexContext) {
  const [url = "http://localhost:3000", apiUrl, budgetArg] = ctx.args;
  const p99BudgetMs = Number(budgetArg ?? 300);

  ctx.intro("preflight");

  const changed = await ctx.git.changedFiles();
  if (changed.length === 0) {
    ctx.log.info("Working tree matches HEAD — nothing to gate.");
    ctx.outro("clean");
    return;
  }

  const uiChanged = changed.filter((file) => UI_PATTERNS.some((p) => p.test(file)));
  const apiChanged = changed.filter((file) => API_PATTERNS.some((p) => p.test(file)));

  ctx.note(
    [
      `${changed.length} file(s) differ from HEAD`,
      uiChanged.length > 0
        ? `UI:  ${uiChanged.length} file(s) -> screenshot diff vs baseline`
        : "UI:  untouched, skipping visual check",
      apiChanged.length > 0
        ? `API: ${apiChanged.length} file(s) -> p99 budget ${p99BudgetMs}ms`
        : "API: untouched, skipping load check",
    ].join("\n"),
    "plan",
  );

  // Compose another script if it's installed: env-diff catches the "works on my
  // machine because .env drifted" class of demo failure before anything else runs.
  try {
    await ctx.runScript("env-diff");
  } catch (error) {
    const missing = error instanceof Error && error.message.startsWith("No script named");
    if (!missing) throw error;
  }

  let failed = false;

  if (uiChanged.length > 0) {
    const dir = join(process.env.FEX_HOME ?? join(homedir(), ".fex"), "baselines", "preflight");
    const baselinePath = join(dir, "desktop.png");

    if (!(await Bun.file(baselinePath).exists())) {
      await ctx.browser.capture(url, baselinePath);
      ctx.log.info(`First run: baseline saved to ${baselinePath}. Future runs compare against it.`);
    } else {
      const currentPath = join(dir, "desktop.current.png");
      const diffPath = join(dir, "desktop.diff.png");
      await ctx.browser.capture(url, currentPath);
      const diff = await ctx.visual.diffImages(baselinePath, currentPath, diffPath, {
        failRatio: FAIL_RATIO,
      });
      const pct = (diff.diffRatio * 100).toFixed(2);
      if (diff.passed) {
        ctx.log.success(`visual: ${pct}% drift — within tolerance`);
      } else {
        ctx.log.error(
          `visual: ${pct}% drift — inspect ${diffPath}; delete ${baselinePath} to accept the new look`,
        );
        failed = true;
      }
    }
  }

  if (apiChanged.length > 0) {
    if (apiUrl) {
      const result = await ctx.load.run(apiUrl, { duration: 5, connections: 10 });
      const p99 = result.latencyMs.p99;
      if (result.errors > 0 || result.timeouts > 0) {
        ctx.log.error(
          `load: ${result.errors} error(s), ${result.timeouts} timeout(s) hitting ${apiUrl}`,
        );
        failed = true;
      } else if (p99 <= p99BudgetMs) {
        ctx.log.success(
          `load: p99 ${p99}ms within the ${p99BudgetMs}ms budget (${result.requestsPerSecond.toFixed(0)} req/s)`,
        );
      } else {
        ctx.log.error(`load: p99 ${p99}ms blows the ${p99BudgetMs}ms budget`);
        failed = true;
      }
    } else {
      ctx.log.warn("API files changed but no apiUrl argument given — skipping the latency check.");
      ctx.log.info("Usage: fex preflight [url] [apiUrl] [p99BudgetMs]");
    }
  }

  if (failed) {
    process.exitCode = 1;
    ctx.outro("Gate failed — fix it or accept the drift, then re-run.");
    return;
  }

  const push = await ctx.prompt.confirm({ message: "All gates green. Push to origin?" });
  if (ctx.isCancel(push) || !push) {
    ctx.outro("Not pushing.");
    return;
  }
  await ctx.$`git push`;
  ctx.outro("Pushed.");
}
