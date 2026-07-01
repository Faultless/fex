async function commandExists(bin: string): Promise<boolean> {
  const proc = Bun.spawn(["which", bin], { stdout: "ignore", stderr: "ignore" });
  return (await proc.exited) === 0;
}

async function resolveCopyCommand(): Promise<string[]> {
  switch (process.platform) {
    case "darwin":
      return ["pbcopy"];
    case "win32":
      return ["clip"];
    default:
      if (await commandExists("wl-copy")) return ["wl-copy"];
      if (await commandExists("xclip")) return ["xclip", "-selection", "clipboard"];
      if (await commandExists("xsel")) return ["xsel", "--clipboard", "--input"];
      throw new Error("No clipboard utility found — install wl-copy, xclip, or xsel");
  }
}

async function resolvePasteCommand(): Promise<string[]> {
  switch (process.platform) {
    case "darwin":
      return ["pbpaste"];
    case "win32":
      return ["powershell.exe", "-noprofile", "-command", "Get-Clipboard"];
    default:
      if (await commandExists("wl-paste")) return ["wl-paste"];
      if (await commandExists("xclip")) return ["xclip", "-selection", "clipboard", "-o"];
      if (await commandExists("xsel")) return ["xsel", "--clipboard", "--output"];
      throw new Error("No clipboard utility found — install wl-copy, xclip, or xsel");
  }
}

export async function copy(text: string): Promise<void> {
  const cmd = await resolveCopyCommand();
  const proc = Bun.spawn(cmd, { stdin: "pipe" });
  proc.stdin.write(text);
  proc.stdin.end();
  await proc.exited;
}

export async function paste(): Promise<string> {
  const cmd = await resolvePasteCommand();
  const proc = Bun.spawn(cmd, { stdout: "pipe" });
  const text = await new Response(proc.stdout).text();
  await proc.exited;
  return text;
}
