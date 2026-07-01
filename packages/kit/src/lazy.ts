/**
 * Heavy, opt-in capabilities (browser automation, load testing, mock data, image
 * diffing) are peerDependencies, not dependencies — `bun install` on @fex/kit alone
 * never pulls them in. This loads one on first use and fails with an install hint
 * instead of a bare "Cannot find module" stack trace.
 */
export async function optionalImport<T>(pkg: string, installHint: string): Promise<T> {
  try {
    return (await import(pkg)) as T;
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "ERR_MODULE_NOT_FOUND" || code === "MODULE_NOT_FOUND") {
      throw new Error(`"${pkg}" isn't installed. Run \`${installHint}\` and try again.`);
    }
    throw error;
  }
}
