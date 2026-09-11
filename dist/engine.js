import { createProviders } from "@agentpad/daemon/dist/providers/index.js";
export class MultiModelEngine {
    providers;
    constructor() {
        this.providers = createProviders();
    }
    getAvailableModels() {
        return Array.from(this.providers.values()).map((p) => ({
            id: p.id,
            name: p.name,
        }));
    }
    async runSingleModel(providerId, prompt, system, effort = "medium") {
        const provider = this.providers.get(providerId);
        if (!provider) {
            return {
                model: providerId,
                provider: providerId,
                success: false,
                text: "",
                error: `Provider '${providerId}' not found. Available: ${Array.from(this.providers.keys()).join(", ")}`,
                durationMs: 0,
                tokensEstimate: 0,
            };
        }
        const start = Date.now();
        let accumulatedText = "";
        let errorDetail = "";
        try {
            await provider.run({
                prompt,
                effort,
                system,
                toolsMode: "off",
            }, (ev) => {
                if (ev.text) {
                    accumulatedText = ev.text;
                }
                if (ev.state === "error" && ev.detail) {
                    errorDetail = ev.detail;
                }
            });
            const durationMs = Date.now() - start;
            const tokensEstimate = Math.ceil((accumulatedText.length + prompt.length) / 4);
            if (errorDetail && !accumulatedText) {
                return {
                    model: provider.name,
                    provider: providerId,
                    success: false,
                    text: "",
                    error: errorDetail,
                    durationMs,
                    tokensEstimate,
                };
            }
            return {
                model: provider.name,
                provider: providerId,
                success: true,
                text: accumulatedText.trim(),
                durationMs,
                tokensEstimate,
            };
        }
        catch (err) {
            const durationMs = Date.now() - start;
            const errorMsg = err instanceof Error ? err.message : String(err);
            return {
                model: provider.name,
                provider: providerId,
                success: false,
                text: "",
                error: errorMsg,
                durationMs,
                tokensEstimate: 0,
            };
        }
    }
    async compare(prompt, modelIds = ["claude", "openai"], system) {
        const startAll = Date.now();
        const promises = modelIds.map((id) => this.runSingleModel(id, prompt, system));
        const settled = await Promise.allSettled(promises);
        const results = settled.map((s, idx) => {
            if (s.status === "fulfilled") {
                return s.value;
            }
            const modelId = modelIds[idx];
            return {
                model: modelId,
                provider: modelId,
                success: false,
                text: "",
                error: s.reason?.message || "Execution failed",
                durationMs: Date.now() - startAll,
                tokensEstimate: 0,
            };
        });
        // Format side-by-side markdown
        let summary = `## ⚡ Multi-Model Comparison (${results.length} Models)\n\n`;
        summary += `**Prompt:** *${prompt.length > 120 ? prompt.slice(0, 120) + "…" : prompt}*\n\n`;
        for (const r of results) {
            const statusIcon = r.success ? "✅" : "❌";
            summary += `### ${statusIcon} ${r.model} (${r.durationMs}ms · ~${r.tokensEstimate} tokens)\n\n`;
            if (r.success) {
                summary += `${r.text}\n\n`;
            }
            else {
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
    async reviewCode(code, context = "", reviewerModels = ["openai", "deepseek"]) {
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
//# sourceMappingURL=engine.js.map