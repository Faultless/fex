/** Substrings excluded from every scan unless `defaultIgnores: false` — bulk
 * find-replace should never silently rewrite dependencies or git internals. */
const DEFAULT_IGNORES = ["node_modules", ".git"];

export interface FindFilesOptions {
  cwd?: string;
  /** Path substrings to skip, merged with the defaults (node_modules, .git). */
  ignore?: string[];
  /** Set false to scan node_modules/.git too. */
  defaultIgnores?: boolean;
}

export async function findFiles(
  pattern: string,
  options: FindFilesOptions = {},
): Promise<string[]> {
  const cwd = options.cwd ?? process.cwd();
  const ignore = [
    ...(options.defaultIgnores === false ? [] : DEFAULT_IGNORES),
    ...(options.ignore ?? []),
  ];
  const glob = new Bun.Glob(pattern);
  const results: string[] = [];
  for await (const file of glob.scan({ cwd, dot: false })) {
    if (ignore.some((fragment) => file.includes(fragment))) continue;
    results.push(file);
  }
  return results;
}

export interface ReplaceInFilesOptions extends FindFilesOptions {
  dryRun?: boolean;
}

export interface ReplaceResult {
  file: string;
  replacements: number;
}

export async function replaceInFiles(
  pattern: string,
  search: string | RegExp,
  replacement: string,
  options: ReplaceInFilesOptions = {},
): Promise<ReplaceResult[]> {
  const cwd = options.cwd ?? process.cwd();
  const files = await findFiles(pattern, options);
  const regex = typeof search === "string" ? new RegExp(escapeRegExp(search), "g") : search;
  const changed: ReplaceResult[] = [];

  for (const relativePath of files) {
    const path = `${cwd}/${relativePath}`;
    const original = await Bun.file(path).text();
    let count = 0;
    const updated = original.replace(regex, () => {
      count++;
      return replacement;
    });
    if (count > 0) {
      changed.push({ file: relativePath, replacements: count });
      if (!options.dryRun) {
        await Bun.write(path, updated);
      }
    }
  }
  return changed;
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
