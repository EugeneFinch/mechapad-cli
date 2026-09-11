import { MultiModelEngine, PROVIDER_PRICING, ModelResult } from "./engine.js";
import type { ProviderId } from "@agentpad/protocol";

export interface BenchmarkMetrics {
  model: string;
  provider: ProviderId;
  success: boolean;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  tokensPerSec: number;
  costUsd: number;
  costSavingsPercent: number;
  text: string;
  error?: string;
}

export async function runScientificCliBenchmark(
  prompt: string,
  modelList?: string[],
): Promise<void> {
  const engine = new MultiModelEngine();
  const available = engine.getAvailableModels();

  let targetModels: ProviderId[] = (modelList && modelList.length > 0)
    ? (modelList as ProviderId[])
    : ["mock", "deepseek", "gemini", "claude", "openai"];

  // Filter to known providers or keep mock for safe testing
  targetModels = targetModels.filter((m) =>
    available.some((a) => a.id === m) || m === "mock"
  );

  if (targetModels.length === 0) {
    targetModels = ["mock"];
  }

  console.log("\n==========================================================================================");
  console.log(" 🔬 \x1b[1m\x1b[36mMECHAPAD SCIENTIFIC MULTI-MODEL BENCHMARK\x1b[0m");
  console.log("==========================================================================================");
  console.log(`\x1b[90mPrompt:\x1b[0m \x1b[1m"${prompt}"\x1b[0m`);
  console.log(`\x1b[90mTarget Providers:\x1b[0m ${targetModels.map((m) => `\x1b[33m${m}\x1b[0m`).join(", ")}`);
  console.log("──────────────────────────────────────────────────────────────────────────────────────────");
  console.log("⏳ Running parallel execution & streaming telemetry...\n");

  const startAll = performance.now();

  const promises = targetModels.map(async (modelId): Promise<BenchmarkMetrics> => {
    const t0 = performance.now();
    const res = await engine.runSingleModel(modelId, prompt);
    const t1 = performance.now();

    const latencyMs = Math.round(t1 - t0);
    const inTokens = res.metrics.inputTokens;
    const outTokens = res.metrics.outputTokens;
    const totTokens = inTokens + outTokens;
    const durationSec = Math.max(0.001, latencyMs / 1000);
    const tokensPerSec = Math.round(outTokens / durationSec);

    return {
      model: res.model,
      provider: modelId,
      success: res.success,
      latencyMs,
      inputTokens: inTokens,
      outputTokens: outTokens,
      totalTokens: totTokens,
      tokensPerSec,
      costUsd: res.metrics.estimatedCostUsd,
      costSavingsPercent: res.metrics.costSavingsPercentVsClaude,
      text: res.text,
      error: res.error,
    };
  });

  const benchmarkResults = await Promise.all(promises);
  const totalElapsedMs = Math.round(performance.now() - startAll);

  // 1. Scientific Summary Table
  console.log("┌──────────────────────────┬────────┬──────────┬──────────┬──────────┬───────────┬─────────────┬──────────────────┐");
  console.log("│ Provider / Model         │ Status │ Latency  │ In / Out │ Total    │ Speed     │ Cost (USD)  │ vs Claude Cost   │");
  console.log("├──────────────────────────┼────────┼──────────┼──────────┼──────────┼───────────┼─────────────┼──────────────────┤");

  for (const b of benchmarkResults) {
    const namePadded = b.model.slice(0, 24).padEnd(24);
    const statusStr = b.success ? "\x1b[32m✔ OK\x1b[0m  " : "\x1b[31m✖ ERR\x1b[0m ";
    const latencyStr = `${b.latencyMs.toLocaleString()}ms`.padEnd(8);
    const inOutStr = `${b.inputTokens}/${b.outputTokens}`.padEnd(8);
    const totStr = `${b.totalTokens}`.padEnd(8);
    const speedStr = b.success ? `${b.tokensPerSec} tok/s`.padEnd(9) : "-        ";
    const costStr =
      b.costUsd === 0
        ? "\x1b[32m$0.0000\x1b[0m    "
        : `$${b.costUsd.toFixed(5)}`.padEnd(11);

    const savingsStr =
      b.provider === "claude"
        ? "\x1b[90mBase (100%)\x1b[0m     "
        : b.costSavingsPercent === 100
        ? "\x1b[32m🎉 100% Free\x1b[0m    "
        : `\x1b[36m⚡ ${b.costSavingsPercent}% Cheaper\x1b[0m `;

    console.log(`│ ${namePadded} │ ${statusStr} │ ${latencyStr} │ ${inOutStr} │ ${totStr} │ ${speedStr} │ ${costStr} │ ${savingsStr}│`);
  }

  console.log("└──────────────────────────┴────────┴──────────┴──────────┴──────────┴───────────┴─────────────┴──────────────────┘");
  console.log(`\x1b[90mTotal Parallel Wall Clock Time:\x1b[0m \x1b[1m${totalElapsedMs}ms\x1b[0m\n`);

  // 2. Output Inspection
  console.log("==========================================================================================");
  console.log(" 📝 \x1b[1mDETAILED MODEL RESPONSES\x1b[0m");
  console.log("==========================================================================================\n");

  for (const b of benchmarkResults) {
    const statusHeader = b.success
      ? `\x1b[32m[${b.model}]\x1b[0m \x1b[90m(${b.latencyMs}ms · ${b.totalTokens} tokens · ${b.tokensPerSec} tok/s · $${b.costUsd.toFixed(5)})\x1b[0m`
      : `\x1b[31m[${b.model}] FAILED\x1b[0m \x1b[90m(${b.latencyMs}ms)\x1b[0m`;

    console.log(`\x1b[1m${statusHeader}\x1b[0m`);
    console.log("─".repeat(80));
    if (b.success) {
      console.log(b.text);
    } else {
      console.log(`\x1b[31mError:\x1b[0m ${b.error}`);
    }
    console.log("\n");
  }
}
