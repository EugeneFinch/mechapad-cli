#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { MultiModelEngine } from "./engine.js";
import { runAgentInstaller } from "./installer.js";
import { runScientificCliBenchmark } from "./cli-compare.js";
import { detectConnectedAccounts, printAccountDashboard } from "./accounts.js";

async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) return "";
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => resolve(data.trim()));
    setTimeout(() => resolve(data.trim()), 1000);
  });
}

async function start() {
  const isStatus =
    process.argv.includes("status") ||
    process.argv.includes("auth") ||
    process.argv.includes("accounts") ||
    process.argv.includes("whoami") ||
    process.argv.includes("--status");
  if (isStatus) {
    printAccountDashboard();
    process.exit(0);
  }

  const isInstaller = process.argv.includes("install") || process.argv.includes("--install");
  if (isInstaller) {
    await runAgentInstaller();
    process.exit(0);
  }

  const isServeMcp =
    process.argv.includes("serve") ||
    process.argv.includes("--mcp") ||
    process.argv.includes("mcp") ||
    process.argv.includes("--stdio") ||
    process.argv.includes("stdio");
  const isInteractiveTerminal = Boolean(process.stdin.isTTY && process.stdout.isTTY);
  const hasArgs = process.argv.length > 2;

  // If run in terminal directly without args, show clean dashboard and instructions
  if (!isServeMcp && isInteractiveTerminal && !hasArgs) {
    console.log("\n⚡ \x1b[1m\x1b[36mMegaPad — Multi-Model AI Control Surface & Native MCP Server\x1b[0m\n");
    console.log("Usage:");
    console.log("  \x1b[1mpad \"<question>\"\x1b[0m          Run a multi-model parallel race & live telemetry");
    console.log("  \x1b[1mpad review\x1b[0m                Run multi-model peer code review council");
    console.log("  \x1b[1mpad status\x1b[0m                View connected accounts & subscriptions");
    console.log("  \x1b[1mpad install\x1b[0m               1-click auto-configurator for Claude, Cursor, Codex\n");
    console.log("Examples:");
    console.log("  \x1b[90m$ pad \"How do I optimize this query?\"\x1b[0m");
    console.log("  \x1b[90m$ git diff | pad review\x1b[0m\n");
    printAccountDashboard();
    process.exit(0);
  }

  // Determine if this is CLI compare/race mode or MCP server mode
  const isCompareCmd =
    !isServeMcp &&
    (process.argv.includes("compare") ||
      process.argv.includes("benchmark") ||
      process.argv.includes("review") ||
      hasArgs ||
      (!process.stdin.isTTY && process.stdout.isTTY));

  // CLI Compare / Benchmark mode
  if (isCompareCmd) {
    const rawArgs = process.argv.slice(2);
    let models: string[] | undefined;
    const modelsIdx = rawArgs.indexOf("--models");
    if (modelsIdx !== -1 && rawArgs[modelsIdx + 1]) {
      models = rawArgs[modelsIdx + 1].split(",").map((s) => s.trim());
      rawArgs.splice(modelsIdx, 2);
    }

    const promptTokens = rawArgs.filter((a) => a !== "compare" && a !== "benchmark");
    let userPrompt = promptTokens.join(" ").trim();
    const pipedStdin = await readStdin();

    if (pipedStdin) {
      userPrompt = userPrompt
        ? `${userPrompt}\n\nInput Context:\n\`\`\`\n${pipedStdin}\n\`\`\``
        : `Analyze and review the following input:\n\`\`\`\n${pipedStdin}\n\`\`\``;
    }

    if (!userPrompt) {
      console.log("\n⚡ \x1b[1m\x1b[36mMegaPad — Multi-Model AI Control Surface & Native MCP Server\x1b[0m\n");
      console.log("Usage:");
      console.log("  \x1b[1mpad \"<question>\"\x1b[0m          Run all available frontier models in parallel");
      console.log("  \x1b[1mpad vs <model> \"<prompt>\"\x1b[0m  Head-to-head race: Claude vs Target (e.g. pad vs grok ...)");
      console.log("  \x1b[1mpad review\x1b[0m                Run multi-model peer code review council");
      console.log("  \x1b[1mpad status\x1b[0m                View connected accounts & subscriptions");
      console.log("  \x1b[1mpad install\x1b[0m               1-click auto-configurator for Claude, Cursor, Codex\n");
      console.log("Examples:");
      console.log("  \x1b[90m$ pad vs grok \"Best SEO strategy for Amazon product launches\"\x1b[0m");
      console.log("  \x1b[90m$ pad deepseek \"Write a Redis rate limiter in TypeScript\"\x1b[0m");
      console.log("  \x1b[90m$ git diff | pad review\x1b[0m\n");
      printAccountDashboard();
      process.exit(0);
    }

    // Smart 1-on-1 vs / model prefix parsing:
    // Supports provider names and specific model tiers:
    // e.g. "vs fable <prompt>", "vs r1 <prompt>", "vs astra <prompt>", "vs flash <prompt>", "vs grok <prompt>"
    const providerAliasMap: Record<string, string> = {
      // Anthropic tiers
      fable: "claude",
      "claude-fable": "claude",
      "claude-5": "claude",
      sonnet: "claude",
      opus: "claude",
      haiku: "claude",
      anthropic: "claude",

      // OpenAI tiers
      astra: "openai",
      "gpt-6": "openai",
      gpt6: "openai",
      sol: "openai",
      luna: "openai",
      codex: "openai",
      chatgpt: "openai",
      gpt: "openai",
      gpt4: "openai",
      gpt5: "openai",
      o3: "openai",
      o4: "openai",

      // DeepSeek tiers
      r1: "deepseek",
      "deepseek-r1": "deepseek",
      v4: "deepseek",
      "v4.1": "deepseek",
      v41: "deepseek",
      reasoner: "deepseek",

      // Google Gemini tiers
      flash: "gemini",
      "gemini-flash": "gemini",
      "gemini-3.8": "gemini",
      cyber: "gemini",
      google: "gemini",

      // Grok tiers
      grok: "grok",
      grok3: "grok",
      xai: "grok",
    };

    const knownProviders = [
      "grok",
      "deepseek",
      "gemini",
      "openai",
      "chatgpt",
      "codex",
      "gpt",
      "claude",
      "fable",
      "sonnet",
      "astra",
      "r1",
      "flash",
      "mock",
    ];

    if (!models) {
      if (userPrompt.toLowerCase().startsWith("review")) {
        const afterReview = userPrompt.slice(6).trim();
        const parts = afterReview ? afterReview.split(" ") : [];
        const first = parts[0]?.toLowerCase() ?? "";
        const potentialModels = first.split(",").map((m) => m.trim().toLowerCase());
        const mappedReviewers = potentialModels
          .map((m) => providerAliasMap[m] || (knownProviders.includes(m) ? m : undefined))
          .filter((m): m is string => Boolean(m));

        if (mappedReviewers.length > 0) {
          models = mappedReviewers;
          userPrompt = parts.slice(1).join(" ").trim() || "Thorough multi-model peer code review for edge-case bugs, security vulnerabilities, memory safety, and performance optimizations.";
        } else {
          models = ["deepseek", "openai"];
          userPrompt = afterReview || "Thorough multi-model peer code review for edge-case bugs, security vulnerabilities, memory safety, and performance optimizations.";
        }
      } else if (userPrompt.toLowerCase().startsWith("vs ")) {
        const parts = userPrompt.slice(3).trim().split(" ");
        const first = parts[0]?.toLowerCase() ?? "";
        const second = parts[1]?.toLowerCase() ?? "";
        const target1 = providerAliasMap[first] || (knownProviders.includes(first) ? first : undefined);
        const target2 = providerAliasMap[second] || (knownProviders.includes(second) ? second : undefined);

        if (target1 && target2 && parts.length > 2) {
          models = [target1, target2];
          userPrompt = parts.slice(2).join(" ").trim();
        } else if (target1) {
          const defaultBase = target1 === "claude" ? "openai" : "claude";
          models = [defaultBase, target1];
          userPrompt = parts.slice(1).join(" ").trim();
        }
      } else {
        const parts = userPrompt.split(" ");
        const rawCandidate = parts[0]?.toLowerCase() ?? "";
        const target = providerAliasMap[rawCandidate] || rawCandidate;
        if (target && (knownProviders.includes(rawCandidate) || knownProviders.includes(target)) && parts.length > 1) {
          const defaultBase = target === "claude" ? "openai" : "claude";
          models = [defaultBase, target];
          userPrompt = parts.slice(1).join(" ").trim();
        }
      }
    }

    await runScientificCliBenchmark(userPrompt, models);
    process.exit(0);
  }

  // Default: Stdio MCP Server mode
  startMcpServer();
}

function startMcpServer() {
  const engine = new MultiModelEngine();

  const server = new Server(
    {
      name: "megapad",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "megapad_compare",
          description:
            "Executes a prompt across multiple AI frontier models (Claude Fable, GPT-6 Astra, Grok 3, DeepSeek V4.1, Gemini 3.8) in parallel and returns side-by-side responses with performance metrics.",
          inputSchema: {
            type: "object",
            properties: {
              prompt: {
                type: "string",
                description: "The prompt or coding question to run across multiple models.",
              },
              models: {
                type: "array",
                items: {
                  type: "string",
                },
                description:
                  "List of models or providers to execute concurrently (e.g. ['grok', 'astra', 'fable', 'deepseek', 'gemini', 'opus']). Defaults to ['claude', 'openai'].",
              },
              system: {
                type: "string",
                description: "Optional custom system instructions for all models.",
              },
            },
            required: ["prompt"],
          },
        },
        {
          name: "megapad_consult_peer",
          description:
            "Asks a specific peer AI model (e.g. Grok 3, OpenAI GPT-6 Astra, DeepSeek V4.1, Gemini, Claude) a targeted question to get a second opinion or instant rival response.",
          inputSchema: {
            type: "object",
            properties: {
              model: {
                type: "string",
                description: "The target model or provider (e.g. grok, astra, codex, deepseek, gemini, opus, fable, claude).",
              },
              prompt: {
                type: "string",
                description: "The query or instruction to send to the target model.",
              },
              system: {
                type: "string",
                description: "Optional custom system instructions.",
              },
            },
            required: ["model", "prompt"],
          },
        },
        {
          name: "megapad_council_code_review",
          description:
            "Sends code to a council of peer models (e.g. OpenAI GPT-6 Astra and DeepSeek V4.1) to find edge-case bugs, security vulnerabilities, and alternative performance optimizations.",
          inputSchema: {
            type: "object",
            properties: {
              code: {
                type: "string",
                description: "The code snippet or implementation to review.",
              },
              context: {
                type: "string",
                description: "Optional context, requirements, language version, or edge-case constraints.",
              },
              reviewer_models: {
                type: "array",
                items: {
                  type: "string",
                },
                description: "Models to include in the review council (e.g. ['openai', 'deepseek', 'grok', 'gemini']). Defaults to ['openai', 'deepseek'].",
              },
            },
            required: ["code"],
          },
        },
        {
          name: "megapad_list_models",
          description: "Lists all configured and available model providers in MegaPad.",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "megapad_status",
          description: "Inspects all connected developer accounts, subscriptions (Codex/ChatGPT, Claude, DeepSeek, Gemini, Cursor), and active readiness.",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      if (name === "megapad_status" || name === "mechapad_status") {
        const accounts = detectConnectedAccounts();
        let summary = "### 🔑 MegaPad Connected Accounts & Readiness\n\n";
        summary += "| Provider / Account | Auth Source | Status | Active Frontier Model |\n";
        summary += "| :--- | :--- | :---: | :--- |\n";
        for (const a of accounts) {
          const icon = a.status === "connected" ? "✅" : a.status === "active_free" ? "⚡" : "❌";
          summary += `| **${a.provider}** | ${a.source} | ${icon} ${a.statusText} | \`${a.activeModel}\` |\n`;
        }
        return {
          content: [
            {
              type: "text",
              text: summary,
            },
          ],
        };
      }
      if (name === "megapad_compare" || name === "mechapad_compare") {
        const prompt = String(args?.prompt || "");
        const models = Array.isArray(args?.models) && args.models.length > 0
          ? (args.models as any[])
          : ["claude", "openai"];
        const system = args?.system ? String(args.system) : undefined;

        const res = await engine.compare(prompt, models, system);
        return {
          content: [
            {
              type: "text",
              text: res.formattedSummary,
            },
          ],
        };
      }

      if (name === "megapad_consult_peer" || name === "mechapad_consult_peer") {
        const model = String(args?.model || "openai");
        const prompt = String(args?.prompt || "");
        const system = args?.system ? String(args.system) : undefined;

        const res = await engine.runSingleModel(model, prompt, system);
        if (res.success) {
          return {
            content: [
              {
                type: "text",
                text: `### [${res.model}] (${res.durationMs}ms · ~${res.metrics.totalTokens} tokens · $${res.metrics.estimatedCostUsd.toFixed(5)})\n\n${res.text}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: `⚠️ **Error from ${res.model}:** ${res.error}`,
              },
            ],
            isError: true,
          };
        }
      }

      if (name === "megapad_council_code_review" || name === "mechapad_council_code_review") {
        const code = String(args?.code || "");
        const context = args?.context ? String(args.context) : "";
        const reviewers = Array.isArray(args?.reviewer_models) && args.reviewer_models.length > 0
          ? (args.reviewer_models as any[])
          : ["openai", "deepseek"];

        const res = await engine.reviewCode(code, context, reviewers);
        return {
          content: [
            {
              type: "text",
              text: res.formattedSummary,
            },
          ],
        };
      }

      if (name === "megapad_list_models" || name === "mechapad_list_models") {
        const models = engine.getAvailableModels();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(models, null, 2),
            },
          ],
        };
      }

      throw new Error(`Unknown tool: ${name}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        content: [
          {
            type: "text",
            text: `MegaPad MCP Error: ${errorMsg}`,
          },
        ],
        isError: true,
      };
    }
  });

  const transport = new StdioServerTransport();
  server.connect(transport).then(() => {
    console.error("MegaPad MCP Server running on stdio");
  }).catch((err) => {
    console.error("Fatal error running MegaPad MCP Server:", err);
    process.exit(1);
  });
}

start().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
