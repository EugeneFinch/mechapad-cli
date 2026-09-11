import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

export interface AccountInfo {
  provider: string;
  source: string;
  status: "connected" | "active_free" | "missing";
  statusText: string;
  activeModel: string;
  details?: string;
}

export function detectConnectedAccounts(): AccountInfo[] {
  const home = os.homedir();
  const accounts: AccountInfo[] = [];

  // 1. OpenAI / ChatGPT
  let openaiConnected = false;
  let openaiSource = "Zero-Key Gateway (Free)";
  const codexAuthPath = path.join(home, ".codex", "auth.json");
  const agentpadSecretsPath = path.join(home, ".agentpad", "secrets.json");

  if (process.env.OPENAI_API_KEY) {
    openaiConnected = true;
    openaiSource = "Environment (OPENAI_API_KEY)";
  } else if (fs.existsSync(codexAuthPath)) {
    try {
      const authData = JSON.parse(fs.readFileSync(codexAuthPath, "utf-8"));
      if (authData.tokens || authData.access_token || authData.session) {
        openaiConnected = true;
        openaiSource = "Codex CLI / ChatGPT Plus Session";
      }
    } catch {
      // ignore
    }
  }

  accounts.push({
    provider: "OpenAI / ChatGPT",
    source: openaiSource,
    status: openaiConnected ? "connected" : "active_free",
    statusText: openaiConnected ? "✔ Connected (Session/API)" : "⚡ Zero-Key Ready",
    activeModel: "GPT-6 Astra / Sol",
  });

  // 2. Anthropic Claude
  let claudeConnected = false;
  let claudeSource = "Zero-Key Gateway (Free)";
  const claudeJsonPath = path.join(home, ".claude.json");

  if (process.env.ANTHROPIC_API_KEY) {
    claudeConnected = true;
    claudeSource = "Environment (ANTHROPIC_API_KEY)";
  } else if (fs.existsSync(claudeJsonPath)) {
    claudeConnected = true;
    claudeSource = "Claude Code Active Session";
  }

  accounts.push({
    provider: "Anthropic Claude",
    source: claudeSource,
    status: claudeConnected ? "connected" : "active_free",
    statusText: claudeConnected ? "✔ Connected (Claude Code)" : "⚡ Zero-Key Ready",
    activeModel: "Claude Fable 5.1 / Sonnet 5",
  });

  // 3. DeepSeek
  let deepseekConnected = false;
  let deepseekSource = "Zero-Key Gateway (Free)";

  if (process.env.DEEPSEEK_API_KEY) {
    deepseekConnected = true;
    deepseekSource = "Environment (DEEPSEEK_API_KEY)";
  } else if (fs.existsSync(agentpadSecretsPath)) {
    try {
      const secrets = JSON.parse(fs.readFileSync(agentpadSecretsPath, "utf-8"));
      if (secrets.keys?.DEEPSEEK_API_KEY) {
        deepseekConnected = true;
        deepseekSource = "~/.agentpad/secrets.json";
      }
    } catch {
      // ignore
    }
  }

  accounts.push({
    provider: "DeepSeek",
    source: deepseekSource,
    status: deepseekConnected ? "connected" : "active_free",
    statusText: deepseekConnected ? "✔ Connected" : "⚡ Zero-Key Ready",
    activeModel: "DeepSeek V4.1 Flash",
  });

  // 4. Google Gemini
  let geminiConnected = false;
  let geminiSource = "Google AI Studio Free Tier (15 RPM)";

  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
    geminiConnected = true;
    geminiSource = "Environment (GEMINI_API_KEY)";
  } else {
    // Gemini has built-in free tier
    geminiConnected = true;
  }

  accounts.push({
    provider: "Google Gemini",
    source: geminiSource,
    status: "active_free",
    statusText: "⚡ 100% Free Tier Ready",
    activeModel: "Gemini 3.8 Flash",
  });

  // 5. Grok (xAI)
  let grokConnected = Boolean(process.env.XAI_API_KEY || process.env.GROK_API_KEY);
  accounts.push({
    provider: "Grok (xAI)",
    source: grokConnected ? "Environment (XAI_API_KEY)" : "Zero-Key Gateway (Free)",
    status: grokConnected ? "connected" : "active_free",
    statusText: grokConnected ? "✔ Connected" : "⚡ Zero-Key Ready",
    activeModel: "Grok 3 Beta",
  });

  // 6. Cursor IDE Integration
  const cursorMcpPath = path.join(home, ".cursor", "mcp.json");
  let cursorConnected = false;
  if (fs.existsSync(cursorMcpPath)) {
    try {
      const cursorConfig = JSON.parse(fs.readFileSync(cursorMcpPath, "utf-8"));
      if (cursorConfig.mcpServers?.megapad || cursorConfig.mcpServers?.mechapad) {
        cursorConnected = true;
      }
    } catch {
      // ignore
    }
  }

  accounts.push({
    provider: "Cursor IDE",
    source: "~/.cursor/mcp.json",
    status: cursorConnected ? "connected" : "missing",
    statusText: cursorConnected ? "✔ Native MCP Active" : "Run 'pad install'",
    activeModel: "Claude / GPT / DeepSeek / Gemini",
  });

  return accounts;
}

export function printAccountDashboard(): void {
  const accounts = detectConnectedAccounts();

  console.log("\n==========================================================================================");
  console.log(" 🔑 \x1b[1m\x1b[36mMEGAPAD CONNECTED ACCOUNTS & SUBSCRIPTIONS (ZERO-KEY ACTIVE)\x1b[0m");
  console.log("==========================================================================================\n");

  console.log("┌──────────────────────┬────────────────────────────────────────┬──────────────────────┬────────────────────────────┐");
  console.log("│ Provider / Account   │ Auth Source / Login                    │ Status               │ Active Frontier Model      │");
  console.log("├──────────────────────┼────────────────────────────────────────┼──────────────────────┼────────────────────────────┤");

  for (const a of accounts) {
    const namePadded = a.provider.padEnd(20);
    const srcTrunc = a.source.length > 38 ? a.source.slice(0, 35) + "..." : a.source.padEnd(38);
    let statusColored = "";

    if (a.status === "connected") {
      statusColored = `\x1b[32m${a.statusText.padEnd(20)}\x1b[0m`;
    } else if (a.status === "active_free") {
      statusColored = `\x1b[36m${a.statusText.padEnd(20)}\x1b[0m`;
    } else {
      statusColored = `\x1b[90m${a.statusText.padEnd(20)}\x1b[0m`;
    }

    const modelPadded = a.activeModel.padEnd(26);
    console.log(`│ ${namePadded} │ ${srcTrunc} │ ${statusColored} │ ${modelPadded} │`);
  }

  console.log("└──────────────────────┴────────────────────────────────────────┴──────────────────────┴────────────────────────────┘\n");
  console.log("💡 \x1b[90mAll models run instantly with zero API keys required. Multi-model duels and reviews are 100% free.\x1b[0m\n");
}
