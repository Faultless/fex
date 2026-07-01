export interface HttpPreset {
  baseUrl?: string;
  headers?: Record<string, string>;
}

export interface HttpOptions extends RequestInit {
  preset?: HttpPreset;
  query?: Record<string, string | number | boolean | undefined>;
}

export async function http(url: string, options: HttpOptions = {}): Promise<Response> {
  const { preset, query, ...init } = options;
  const target = new URL(url, preset?.baseUrl);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) target.searchParams.set(key, String(value));
    }
  }
  return fetch(target, {
    ...init,
    headers: { ...preset?.headers, ...init.headers },
  });
}

export async function httpJson<T = unknown>(url: string, options: HttpOptions = {}): Promise<T> {
  const response = await http(url, options);
  if (!response.ok) {
    throw new Error(`Request to ${url} failed: ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as T;
}

/** Reads a dot-path (e.g. "data.items.0.name") out of a parsed JSON value — a jq-lite for scripts. */
export function pick(data: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc == null) return undefined;
    if (Array.isArray(acc)) return /^\d+$/.test(key) ? acc[Number(key)] : undefined;
    return (acc as Record<string, unknown>)[key];
  }, data);
}
