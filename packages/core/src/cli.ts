#!/usr/bin/env bun
import { type ScriptModule, createContext, log } from "@fex/kit";
import { Command } from "commander";
import { initCommand } from "./commands/init";
import { listCommand } from "./commands/list";
import { loadCommand } from "./commands/load";
import { mockCommand } from "./commands/mock";
import { newCommand } from "./commands/new";
import { newFlowCommand } from "./commands/new-flow";
import { portCommand } from "./commands/port";
import { screenshotDiffCommand } from "./commands/screenshot-diff";
import { type DiscoveredScript, discoverScripts } from "./discovery";

const program = new Command();
program.name("fex").description("A frontend developer's scriptable toolbox").version("0.0.1");

program.command("init").description("Set up ~/.fex").action(initCommand);

program
  .command("new [name]")
  .description("Scaffold a new script in ~/.fex/scripts")
  .action(newCommand);

program
  .command("new-flow [name]")
  .description("Scaffold a new reusable step-flow in ~/.fex/flows")
  .action(newFlowCommand);

program.command("list").description("List discovered scripts").action(listCommand);

program
  .command("screenshot-diff <before> <after>")
  .description("Pixel-diff two PNGs or URLs (captured via Chromium) and write a diff image")
  .option("-o, --out <path>", "diff image output path")
  .option("-t, --threshold <n>", "per-pixel color threshold, 0-1")
  .action(screenshotDiffCommand);

program
  .command("load <url>")
  .description("Stress-test a URL with autocannon")
  .option("-c, --connections <n>", "concurrent connections")
  .option("-d, --duration <seconds>", "how long to run")
  .option("-a, --amount <n>", "fixed request count instead of a duration")
  .option("-m, --method <method>", "HTTP method")
  .action(loadCommand);

program
  .command("mock [count]")
  .description("Generate fake data — guided wizard, or --from a sample JSON file")
  .option("-f, --from <path>", "sample JSON file to infer field types from")
  .option("-o, --out <path>", "write to a file instead of stdout")
  .action(mockCommand);

program
  .command("port <number>")
  .description("Find (and optionally kill) whatever is listening on a port")
  .action(portCommand);

async function runScript(script: DiscoveredScript, args: string[]): Promise<void> {
  let mod: Partial<ScriptModule>;
  try {
    mod = (await import(script.file)) as Partial<ScriptModule>;
  } catch (error) {
    log.error(`${script.file} failed to load:\n${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
    return;
  }
  if (typeof mod.run !== "function") {
    log.error(`${script.file} no longer exports a "run" function.`);
    process.exitCode = 1;
    return;
  }
  await mod.run(createContext(args));
}

const { scripts, skipped } = await discoverScripts();
const taken = new Set([...program.commands.map((cmd) => cmd.name()), "help"]);

for (const script of scripts) {
  const name = script.meta.name;
  if (taken.has(name)) {
    console.warn(`fex: skipping ${script.file} — "${name}" is already taken`);
    continue;
  }
  taken.add(name);
  program
    .command(name)
    .description(script.meta.description)
    .allowUnknownOption()
    .argument("[args...]", "arguments forwarded to the script")
    .action((args: string[]) => runScript(script, args));
}

for (const entry of skipped) {
  console.warn(`fex: skipping broken script ${entry.file}: ${entry.reason}`);
}

await program.parseAsync(process.argv);
