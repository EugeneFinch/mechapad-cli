import type { ProviderId } from "@agentpad/protocol";
export interface ModelResult {
    model: string;
    provider: ProviderId;
    success: boolean;
    text: string;
    error?: string;
    durationMs: number;
    tokensEstimate: number;
}
export interface CompareResult {
    prompt: string;
    timestamp: string;
    results: ModelResult[];
    formattedSummary: string;
}
export declare class MultiModelEngine {
    private providers;
    constructor();
    getAvailableModels(): {
        id: string;
        name: string;
    }[];
    runSingleModel(providerId: ProviderId, prompt: string, system?: string, effort?: string): Promise<ModelResult>;
    compare(prompt: string, modelIds?: ProviderId[], system?: string): Promise<CompareResult>;
    reviewCode(code: string, context?: string, reviewerModels?: ProviderId[]): Promise<CompareResult>;
}
//# sourceMappingURL=engine.d.ts.map