#!/usr/bin/env bun
import { createContext } from "@fex/kit";
import { Command } from "commander";
import { initCommand } from "./commands/init";
import { listCommand } from "./commands/list";
import { loadCommand } from "./commands/load";
import { mockCommand } from "./commands/mock";
import { newCommand } from "./commands/new";
import { newFlowCommand } from "./commands/new-flow";
import { portCommand } from "./commands/port";
import { screenshotDiffCommand } from "./commands/screenshot-diff";
import { discoverScripts } from "./discovery";

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

const scripts = await discoverScripts();
for (const script of scripts) {
  program
    .command(script.meta.name)
    .description(script.meta.description)
    .allowUnknownOption()
    .argument("[args...]", "arguments forwarded to the script")
    .action(async (args: string[]) => {
      await script.run(createContext(args));
    });
}

await program.parseAsync(process.argv);
