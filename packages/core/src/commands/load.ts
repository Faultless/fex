import { intro, load, log, note, outro } from "@fex/kit";

export interface LoadCommandOptions {
  connections?: string;
  duration?: string;
  amount?: string;
  method?: string;
}

export async function loadCommand(url: string, options: LoadCommandOptions): Promise<void> {
  intro("fex load");

  try {
    const result = await load.run(url, {
      connections: options.connections ? Number(options.connections) : undefined,
      duration: options.duration ? Number(options.duration) : undefined,
      amount: options.amount ? Number(options.amount) : undefined,
      method: options.method,
    });

    note(
      [
        `requests/sec: ${result.requestsPerSecond.toFixed(1)}`,
        `latency avg/p50/p97.5/p99 (ms): ${result.latencyMs.avg}/${result.latencyMs.p50}/${result.latencyMs.p97_5}/${result.latencyMs.p99}`,
        `throughput: ${(result.throughputBytesPerSecond / 1024).toFixed(1)} KB/s`,
        `errors: ${result.errors}, timeouts: ${result.timeouts}`,
      ].join("\n"),
      `${url} — ${result.durationSeconds}s`,
    );
  } catch (error) {
    log.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }

  outro("done");
}
