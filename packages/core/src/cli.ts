#!/usr/bin/env bun
import { createContext } from "@fex/kit";
import { Command } from "commander";
import { initCommand } from "./commands/init";
import { listCommand } from "./commands/list";
import { newCommand } from "./commands/new";
import { discoverScripts } from "./discovery";

const program = new Command();
program.name("fex").description("A frontend developer's scriptable toolbox").version("0.0.1");

program.command("init").description("Set up ~/.fex").action(initCommand);

program
  .command("new [name]")
  .description("Scaffold a new script in ~/.fex/scripts")
  .action(newCommand);

program.command("list").description("List discovered scripts").action(listCommand);

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
