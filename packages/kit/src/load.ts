import { optionalImport } from "./lazy";

const INSTALL_HINT = "bun add -D autocannon";

export interface LoadOptions {
  connections?: number;
  /** Seconds to run for. Ignored if `amount` is set. */
  duration?: number;
  /** Fixed number of requests instead of a fixed duration. */
  amount?: number;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

export interface LoadResult {
  requestsPerSecond: number;
  latencyMs: { avg: number; p50: number; p97_5: number; p99: number };
  throughputBytesPerSecond: number;
  errors: number;
  timeouts: number;
  durationSeconds: number;
}

export async function run(url: string, options: LoadOptions = {}): Promise<LoadResult> {
  type Fire = (opts: Record<string, unknown>) => Promise<AutocannonResult>;
  const mod = await optionalImport<{ default?: Fire } & Fire>("autocannon", INSTALL_HINT);
  const fire = mod.default ?? mod;

  const result = await fire({
    url,
    connections: options.connections ?? 10,
    duration: options.amount ? undefined : (options.duration ?? 10),
    amount: options.amount,
    method: options.method ?? "GET",
    headers: options.headers,
    body: options.body,
  });

  return {
    requestsPerSecond: result.requests.average,
    latencyMs: {
      avg: result.latency.average,
      p50: result.latency.p50,
      p97_5: result.latency.p97_5,
      p99: result.latency.p99,
    },
    throughputBytesPerSecond: result.throughput.average,
    errors: result.errors,
    timeouts: result.timeouts,
    durationSeconds: result.duration,
  };
}

interface AutocannonResult {
  requests: { average: number };
  latency: { average: number; p50: number; p97_5: number; p99: number };
  throughput: { average: number };
  errors: number;
  timeouts: number;
  duration: number;
}
