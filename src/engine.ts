import { createProviders, type Provider, type ProviderEvent } from "@agentpad/daemon/dist/providers/index.js";
import type { ProviderId } from "@agentpad/protocol";

export interface ProviderPricing {
  name: string;
  inputPer1M: number;
  outputPer1M: number;
  isSubscriptionOrFree?: boolean;
}

export const PROVIDER_PRICING: Record<string, ProviderPricing> = {
  claude: {
    name: "Claude 3.7 Sonnet",
    inputPer1M: 3.0,
    outputPer1M: 15.0,
  },
  openai: {
    name: "OpenAI GPT-4o",
    inputPer1M: 2.5,
    outputPer1M: 10.0,
  },
  chatgpt: {
    name: "ChatGPT Plus/Pro (Subscription)",
    inputPer1M: 0.0,
    outputPer1M: 0.0,
    isSubscriptionOrFree: true,
  },
  deepseek: {
    name: "DeepSeek R1 / V3",
    inputPer1M: 0.14,
    outputPer1M: 0.28,
  },
  gemini: {
    name: "Gemini 2.5 Flash",
    inputPer1M: 0.075,
    outputPer1M: 0.3,
    isSubscriptionOrFree: true, // Free tier quota
  },
  grok: {
    name: "Grok (xAI)",
    inputPer1M: 2.0,
    outputPer1M: 10.0,
  },
  mock: {
    name: "Mock Engine",
    inputPer1M: 0.0,
    outputPer1M: 0.0,
    isSubscriptionOrFree: true,
  },
};

export interface TokenMetrics {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  costSavingsPercentVsClaude: number;
}

export interface ModelResult {
  model: string;
  provider: ProviderId;
  success: boolean;
  text: string;
  error?: string;
  durationMs: number;
  metrics: TokenMetrics;
}

export interface CompareResult {
  prompt: string;
  timestamp: string;
  results: ModelResult[];
  formattedSummary: string;
}

export class MultiModelEngine {
  private providers: Map<ProviderId, Provider>;

  constructor() {
    this.providers = createProviders();
  }

  public getAvailableModels(): { id: string; name: string }[] {
    return Array.from(this.providers.values()).map((p) => ({
      id: p.id,
      name: p.name,
    }));
  }

  private calculateTokens(prompt: string, output: string, providerId: string): TokenMetrics {
    // Standard LLM token estimation (~3.8 chars per token for code & technical english)
    const inputTokens = Math.max(1, Math.ceil(prompt.length / 3.8));
    const outputTokens = output ? Math.ceil(output.length / 3.8) : 0;
    const totalTokens = inputTokens + outputTokens;

    const pricing = PROVIDER_PRICING[providerId] ?? {
      name: providerId,
      inputPer1M: 1.0,
      outputPer1M: 3.0,
    };

    const costUsd =
      (inputTokens / 1_000_000) * pricing.inputPer1M +
      (outputTokens / 1_000_000) * pricing.outputPer1M;

    // Compare vs Claude 3.7 baseline
    const claudeCost =
      (inputTokens / 1_000_000) * PROVIDER_PRICING.claude.inputPer1M +
      (outputTokens / 1_000_000) * PROVIDER_PRICING.claude.outputPer1M;

    let savingsPercent = 0;
    if (claudeCost > 0) {
      savingsPercent = Math.max(0, Math.round(((claudeCost - costUsd) / claudeCost) * 100));
    }

    return {
      inputTokens,
      outputTokens,
      totalTokens,
      estimatedCostUsd: Number(costUsd.toFixed(6)),
      costSavingsPercentVsClaude: savingsPercent,
    };
  }

  public async runSingleModel(
    providerId: ProviderId,
    prompt: string,
    system?: string,
    effort = "medium",
  ): Promise<ModelResult> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      return {
        model: providerId,
        provider: providerId,
        success: false,
        text: "",
        error: `Provider '${providerId}' not found. Available: ${Array.from(this.providers.keys()).join(", ")}`,
        durationMs: 0,
        metrics: {
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          estimatedCostUsd: 0,
          costSavingsPercentVsClaude: 0,
        },
      };
    }

    const start = Date.now();
    let accumulatedText = "";
    let errorDetail = "";

    try {
      await provider.run(
        {
          prompt,
          effort,
          system,
          toolsMode: "off",
        },
        (ev: ProviderEvent) => {
          if (ev.text) {
            accumulatedText = ev.text;
          }
          if (ev.state === "error" && ev.detail) {
            errorDetail = ev.detail;
          }
        },
      );

      const durationMs = Date.now() - start;
      const metrics = this.calculateTokens(prompt, accumulatedText, providerId);

      if (errorDetail && !accumulatedText) {
        return {
          model: provider.name,
          provider: providerId,
          success: false,
          text: "",
          error: errorDetail,
          durationMs,
          metrics,
        };
      }

      return {
        model: provider.name,
        provider: providerId,
        success: true,
        text: accumulatedText.trim(),
        durationMs,
        metrics,
      };
    } catch (err) {
      const durationMs = Date.now() - start;
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        model: provider.name,
        provider: providerId,
        success: false,
        text: "",
        error: errorMsg,
        durationMs,
        metrics: this.calculateTokens(prompt, "", providerId),
      };
    }
  }

  public async compare(
    prompt: string,
    modelIds: ProviderId[] = ["claude", "openai"],
    system?: string,
  ): Promise<CompareResult> {
    const startAll = Date.now();
    const promises = modelIds.map((id) => this.runSingleModel(id, prompt, system));
    const settled = await Promise.allSettled(promises);

    const results: ModelResult[] = settled.map((s, idx) => {
      if (s.status === "fulfilled") {
        return s.value;
      }
      const modelId = modelIds[idx]!;
      return {
        model: modelId,
        provider: modelId,
        success: false,
        text: "",
        error: s.reason?.message || "Execution failed",
        durationMs: Date.now() - startAll,
        metrics: this.calculateTokens(prompt, "", modelId),
      };
    });

    // Format side-by-side comparison with detailed token & cost metrics table
    let summary = `## ⚡ Multi-Model Parallel Execution & Token Analytics\n\n`;
    summary += `**Prompt:** *${prompt.length > 100 ? prompt.slice(0, 100) + "…" : prompt}*\n\n`;

    // 1. Analytics & Cost Breakdown Table
    summary += `### 📊 Token & Cost Efficiency Breakdown\n\n`;
    summary += `| Provider | Status | Latency | In Tokens | Out Tokens | Total Tokens | Est. Cost (USD) | vs Claude Cost |\n`;
    summary += `| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n`;

    for (const r of results) {
      const statusIcon = r.success ? "✅" : "❌";
      const latencyStr = `${r.durationMs.toLocaleString()}ms`;
      const inTok = r.metrics.inputTokens.toLocaleString();
      const outTok = r.metrics.outputTokens.toLocaleString();
      const totTok = r.metrics.totalTokens.toLocaleString();
      const costStr =
        r.metrics.estimatedCostUsd === 0
          ? "**$0.000 (Free/Sub)**"
          : `$${r.metrics.estimatedCostUsd.toFixed(5)}`;
      const savingsStr =
        r.provider === "claude"
          ? "Base (100%)"
          : r.metrics.costSavingsPercentVsClaude === 100
          ? "🎉 **100% Free**"
          : `⚡ **${r.metrics.costSavingsPercentVsClaude}% Cheaper**`;

      summary += `| **${r.model}** | ${statusIcon} | ${latencyStr} | ${inTok} | ${outTok} | ${totTok} | ${costStr} | ${savingsStr} |\n`;
    }

    summary += `\n---\n\n`;

    // 2. Full Side-by-Side Model Responses
    summary += `### 📝 Model Responses Side-by-Side\n\n`;
    for (const r of results) {
      const statusIcon = r.success ? "✅" : "❌";
      summary += `#### ${statusIcon} ${r.model} (${r.durationMs}ms · ~${r.metrics.totalTokens} tokens)\n\n`;
      if (r.success) {
        summary += `${r.text}\n\n`;
      } else {
        summary += `> ⚠️ **Error:** ${r.error}\n\n`;
      }
      summary += `---\n\n`;
    }

    return {
      prompt,
      timestamp: new Date().toISOString(),
      results,
      formattedSummary: summary,
    };
  }

  public async reviewCode(
    code: string,
    context = "",
    reviewerModels: ProviderId[] = ["openai", "deepseek"],
  ): Promise<CompareResult> {
    const reviewPrompt = `You are a principal software engineer conducting an expert code review.
Review the following code thoroughly:
- Identify bugs, edge-cases, memory leaks, and race conditions.
- Suggest architectural and performance optimizations.
- Provide a clean, corrected refactoring if necessary.

Context / Requirements:
${context || "General production readiness review"}

Code to review:
\`\`\`
${code}
\`\`\`
`;

    return this.compare(reviewPrompt, reviewerModels, "You are a senior code review specialist.");
  }
}
