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
  const isInstaller = process.argv.includes("install") || process.argv.includes("--install");
  if (isInstaller) {
    await runAgentInstaller();
    process.exit(0);
  }

  const isServeMcp = process.argv.includes("serve") || process.argv.includes("--mcp");
  const isCompareCmd =
    process.argv.includes("compare") ||
    process.argv.includes("benchmark") ||
    (!isServeMcp && process.argv.length > 2 && !process.argv[2].startsWith("-"));

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
      userPrompt = "Write an optimized LRU cache in TypeScript and analyze time/space complexity.";
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
            "Executes a prompt across multiple AI frontier models (Claude, OpenAI / GPT-6, DeepSeek, Gemini, Grok) in parallel and returns side-by-side responses with performance metrics for comparison.",
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
                  enum: ["claude", "openai", "deepseek", "gemini", "grok", "mock"],
                },
                description:
                  "List of model providers to execute concurrently. Defaults to ['claude', 'openai'].",
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
            "Asks a specific peer AI model (e.g. DeepSeek R1 for mathematical reasoning or OpenAI GPT-6 for code) a targeted question to get a second opinion.",
          inputSchema: {
            type: "object",
            properties: {
              model: {
                type: "string",
                enum: ["claude", "openai", "deepseek", "gemini", "grok", "mock"],
                description: "The target model provider to query.",
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
            "Sends code to a council of peer models (e.g. DeepSeek and OpenAI) to find edge-case bugs, security vulnerabilities, and alternative performance optimizations.",
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
                  enum: ["openai", "deepseek", "claude", "gemini", "grok", "mock"],
                },
                description: "Models to include in the review council. Defaults to ['openai', 'deepseek'].",
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
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
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
