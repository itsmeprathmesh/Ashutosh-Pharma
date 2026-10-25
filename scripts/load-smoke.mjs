import os from "node:os";
import { performance } from "node:perf_hooks";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3100";
if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(baseUrl)) {
  throw new Error("Load smoke tests only run against localhost. BASE_URL must use http://localhost or http://127.0.0.1.");
}

const concurrency = Math.min(10, Math.max(1, Number.parseInt(process.env.LOAD_VUS ?? "5", 10) || 5));
const durationSeconds = Math.min(60, Math.max(5, Number.parseInt(process.env.LOAD_DURATION ?? "15", 10) || 15));
const routes = ["/", "/shop", "/about", "/api/categories", "/api/products?q=paracetamol"];
const measurements = [];
const startAt = Date.now();
const endAt = startAt + durationSeconds * 1000;

async function worker(workerId) {
  let index = workerId;
  while (Date.now() < endAt) {
    const path = routes[index++ % routes.length];
    const start = performance.now();
    try {
      const response = await fetch(new URL(path, baseUrl), { signal: AbortSignal.timeout(10_000) });
      await response.arrayBuffer();
      measurements.push({ path: path.split("?")[0], ms: performance.now() - start, ok: response.status >= 200 && response.status < 400, status: response.status });
    } catch {
      measurements.push({ path: path.split("?")[0], ms: performance.now() - start, ok: false, status: 0 });
    }
  }
}

await Promise.all(Array.from({ length: concurrency }, (_, index) => worker(index)));
const elapsedSeconds = (Date.now() - startAt) / 1000;
const sorted = measurements.map((item) => item.ms).sort((a, b) => a - b);
const percentile = (value) => sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * value) - 1)] ?? 0;
const failed = measurements.filter((item) => !item.ok).length;
const statuses = Object.fromEntries([...new Set(measurements.map((item) => item.status))].map((status) => [status, measurements.filter((item) => item.status === status).length]));
const runnerUsage = process.resourceUsage();
const byRoute = Object.fromEntries(routes.map((route) => {
  const path = route.split("?")[0];
  const routeMeasurements = measurements.filter((item) => item.path === path);
  const routeLatencies = routeMeasurements.map((item) => item.ms).sort((a, b) => a - b);
  const routePercentile = (value) => routeLatencies[Math.min(routeLatencies.length - 1, Math.ceil(routeLatencies.length * value) - 1)] ?? 0;
  return [path, { requests: routeMeasurements.length, errors: routeMeasurements.filter((item) => !item.ok).length, p50Ms: Number(routePercentile(0.5).toFixed(1)), p95Ms: Number(routePercentile(0.95).toFixed(1)) }];
}));

console.log(JSON.stringify({
  target: baseUrl,
  durationSeconds: elapsedSeconds,
  virtualUsers: concurrency,
  requests: measurements.length,
  requestsPerSecond: Number((measurements.length / elapsedSeconds).toFixed(2)),
  errorRate: Number((failed / Math.max(1, measurements.length)).toFixed(4)),
  statusCounts: statuses,
  latencyMs: { p50: Number(percentile(0.5).toFixed(1)), p95: Number(percentile(0.95).toFixed(1)), p99: Number(percentile(0.99).toFixed(1)) },
  byRoute,
  runner: { rssMiB: Number((process.memoryUsage().rss / 1024 / 1024).toFixed(1)), cpuUserMs: Number((runnerUsage.userCPUTime / 1000).toFixed(1)), cpuSystemMs: Number((runnerUsage.systemCPUTime / 1000).toFixed(1)), hostMemoryGiB: Number((os.totalmem() / 1024 ** 3).toFixed(1)) },
}, null, 2));

if (failed > 0) process.exitCode = 1;
