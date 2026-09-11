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
  let openaiSource = "MegaPad Free Gateway";
  const codexAuthPath = path.join(home, ".codex", "auth.json");
  const agentpadSecretsPath = path.join(home, ".agentpad", "secrets.json");

  if (process.env.OPENAI_API_KEY) {
    openaiConnected = true;
    openaiSource = "Active Session";
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
    status: "connected",
    statusText: openaiConnected ? "✔ Active Session" : "⚡ Zero-Key Gateway",
    activeModel: "GPT-6 Astra / Sol",
  });

  // 2. Anthropic Claude
  let claudeConnected = false;
  let claudeSource = "MegaPad Free Gateway";
  const claudeJsonPath = path.join(home, ".claude.json");

  if (process.env.ANTHROPIC_API_KEY) {
    claudeConnected = true;
    claudeSource = "Active Session";
  } else if (fs.existsSync(claudeJsonPath)) {
    claudeConnected = true;
    claudeSource = "Claude Code Active Session";
  }

  accounts.push({
    provider: "Anthropic Claude",
    source: claudeSource,
    status: "connected",
    statusText: claudeConnected ? "✔ Active Session" : "⚡ Zero-Key Gateway",
    activeModel: "Claude Fable 5.1 / Sonnet 5",
  });

  // 3. DeepSeek
  let deepseekConnected = false;
  let deepseekSource = "MegaPad Free Gateway";

  if (process.env.DEEPSEEK_API_KEY) {
    deepseekConnected = true;
    deepseekSource = "DeepSeek Cloud Session";
  } else if (fs.existsSync(agentpadSecretsPath)) {
    try {
      const secrets = JSON.parse(fs.readFileSync(agentpadSecretsPath, "utf-8"));
      if (secrets.keys?.DEEPSEEK_API_KEY) {
        deepseekConnected = true;
        deepseekSource = "DeepSeek Cloud Session";
      }
    } catch {
      // ignore
    }
  }

  accounts.push({
    provider: "DeepSeek",
    source: deepseekSource,
    status: "connected",
    statusText: deepseekConnected ? "✔ Active Cloud" : "⚡ Zero-Key Gateway",
    activeModel: "DeepSeek V4.1 Flash",
  });

  // 4. Google Gemini
  let geminiSource = "Google Cloud Free Tier (15 RPM)";
  accounts.push({
    provider: "Google Gemini",
    source: geminiSource,
    status: "active_free",
    statusText: "⚡ 100% Free Forever",
    activeModel: "Gemini 3.8 Flash",
  });

  // 5. Grok (xAI)
  let grokConnected = Boolean(process.env.XAI_API_KEY || process.env.GROK_API_KEY);
  let grokSource = "MegaPad Free Gateway";
  let grokModel = "Grok 4.6 / Build";
  const grokAuthPath = path.join(home, ".grok", "auth.json");

  if (grokConnected) {
    grokSource = "xAI API Key";
  } else if (fs.existsSync(grokAuthPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(grokAuthPath, "utf-8"));
      for (const v of Object.values(raw)) {
        if (v && typeof v === "object" && (v.key || v.refresh_token)) {
          grokConnected = true;
          grokSource = v.email ? `Grok CLI (${v.email})` : "Grok CLI Active Session";
          break;
        }
      }
    } catch {
      // ignore
    }
  }

  accounts.push({
    provider: "Grok (xAI)",
    source: grokSource,
    status: "connected",
    statusText: grokConnected ? "✔ Active Session" : "⚡ Zero-Key Gateway",
    activeModel: grokModel,
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
    status: cursorConnected ? "connected" : "active_free",
    statusText: cursorConnected ? "✔ Native MCP Active" : "Run 'pad install'",
    activeModel: "Claude / GPT / DeepSeek / Gemini",
  });

  return accounts;
}

export function printAccountDashboard(): void {
  const accounts = detectConnectedAccounts();

  console.log("\n==========================================================================================");
  console.log(" 🔑 \x1b[1m\x1b[36mMEGAPAD CONNECTED SESSIONS & ZERO-KEY FRONTIER MODELS\x1b[0m");
  console.log("==========================================================================================\n");

  console.log("┌──────────────────────┬────────────────────────────────────────┬──────────────────────┬────────────────────────────┐");
  console.log("│ Provider / Account   │ Active Auth / Session                  │ Status               │ Active Frontier Model      │");
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
  console.log("💡 \x1b[90mZero API keys required. MegaPad automatically uses your active tool sessions and hosted gateway.\x1b[0m\n");
}
