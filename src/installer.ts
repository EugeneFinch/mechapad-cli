import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

interface InstallResult {
  target: string;
  status: "installed" | "updated" | "already_configured" | "skipped";
  path: string;
  notes?: string;
}

export async function runAgentInstaller(): Promise<InstallResult[]> {
  console.log("\n🚀 \x1b[1m\x1b[36mMegaPad MCP — Multi-Agent Auto-Configurator\x1b[0m");
  console.log("Configuring Claude Code, Cursor, Codex CLI, and Antigravity...\n");

  const results: InstallResult[] = [];
  const home = os.homedir();

  // 1. Claude Code
  try {
    const claudeConfigPath = path.join(home, ".claude.json");
    let claudeConfig: any = {};
    if (fs.existsSync(claudeConfigPath)) {
      try {
        claudeConfig = JSON.parse(fs.readFileSync(claudeConfigPath, "utf-8"));
      } catch {
        claudeConfig = {};
      }
    }

    if (!claudeConfig.mcpServers) claudeConfig.mcpServers = {};

    const mcpDefinition = {
      command: "npx",
      args: ["-y", "megapad"],
      env: {},
    };

    const isExisting = Boolean(claudeConfig.mcpServers.megapad);
    claudeConfig.mcpServers.megapad = mcpDefinition;
    fs.writeFileSync(claudeConfigPath, JSON.stringify(claudeConfig, null, 2));

    // Auto-allow permissions in ~/.claude/settings.json if it exists
    const claudeSettingsDir = path.join(home, ".claude");
    const claudeSettingsPath = path.join(claudeSettingsDir, "settings.json");
    if (fs.existsSync(claudeSettingsDir)) {
      let settings: any = {};
      if (fs.existsSync(claudeSettingsPath)) {
        try {
          settings = JSON.parse(fs.readFileSync(claudeSettingsPath, "utf-8"));
        } catch {
          settings = {};
        }
      }
      if (!settings.permissions) settings.permissions = {};
      if (!Array.isArray(settings.permissions.allow)) settings.permissions.allow = [];

      const permissions = [
        "mcp__megapad__megapad_compare",
        "mcp__megapad__megapad_consult_peer",
        "mcp__megapad__megapad_council_code_review",
        "mcp__megapad__megapad_list_models",
      ];

      for (const p of permissions) {
        if (!settings.permissions.allow.includes(p)) {
          settings.permissions.allow.push(p);
        }
      }
      fs.writeFileSync(claudeSettingsPath, JSON.stringify(settings, null, 2));
    }

    results.push({
      target: "Claude Code",
      status: isExisting ? "updated" : "installed",
      path: claudeConfigPath,
      notes: "Auto-configured stdio server & permissions.",
    });
  } catch (err: any) {
    results.push({
      target: "Claude Code",
      status: "skipped",
      path: path.join(home, ".claude.json"),
      notes: err.message,
    });
  }

  // 2. Cursor IDE
  try {
    const cursorDir = path.join(home, ".cursor");
    const cursorMcpPath = path.join(cursorDir, "mcp.json");

    if (fs.existsSync(cursorDir)) {
      let cursorConfig: any = {};
      if (fs.existsSync(cursorMcpPath)) {
        try {
          cursorConfig = JSON.parse(fs.readFileSync(cursorMcpPath, "utf-8"));
        } catch {
          cursorConfig = {};
        }
      }
      if (!cursorConfig.mcpServers) cursorConfig.mcpServers = {};

      const isExisting = Boolean(cursorConfig.mcpServers.megapad);
      cursorConfig.mcpServers.megapad = {
        command: "npx",
        args: ["-y", "megapad"],
      };

      fs.writeFileSync(cursorMcpPath, JSON.stringify(cursorConfig, null, 2));
      results.push({
        target: "Cursor IDE (Global)",
        status: isExisting ? "updated" : "installed",
        path: cursorMcpPath,
        notes: "Restart Cursor for changes to take effect.",
      });
    } else {
      const localCursorDir = path.join(process.cwd(), ".cursor");
      if (fs.existsSync(localCursorDir)) {
        const localMcpPath = path.join(localCursorDir, "mcp.json");
        let localConfig: any = {};
        if (fs.existsSync(localMcpPath)) {
          try {
            localConfig = JSON.parse(fs.readFileSync(localMcpPath, "utf-8"));
          } catch {
            localConfig = {};
          }
        }
        if (!localConfig.mcpServers) localConfig.mcpServers = {};
        localConfig.mcpServers.megapad = {
          command: "npx",
          args: ["-y", "megapad"],
        };
        fs.writeFileSync(localMcpPath, JSON.stringify(localConfig, null, 2));
        results.push({
          target: "Cursor IDE (Workspace)",
          status: "installed",
          path: localMcpPath,
        });
      }
    }
  } catch (err: any) {
    results.push({
      target: "Cursor IDE",
      status: "skipped",
      path: path.join(home, ".cursor/mcp.json"),
      notes: err.message,
    });
  }

  // 3. Codex CLI
  try {
    const codexDir = path.join(home, ".codex");
    const codexConfigPath = path.join(codexDir, "config.toml");
    if (fs.existsSync(codexDir)) {
      let content = "";
      if (fs.existsSync(codexConfigPath)) {
        content = fs.readFileSync(codexConfigPath, "utf-8");
      }

      if (!content.includes("[mcp.megapad]")) {
        const block = `\n\n[mcp.megapad]\ncommand = "npx"\nargs = ["-y", "megapad"]\n`;
        fs.appendFileSync(codexConfigPath, block);
        results.push({
          target: "Codex CLI",
          status: "installed",
          path: codexConfigPath,
        });
      } else {
        results.push({
          target: "Codex CLI",
          status: "already_configured",
          path: codexConfigPath,
        });
      }
    }
  } catch (err: any) {
    results.push({
      target: "Codex CLI",
      status: "skipped",
      path: path.join(home, ".codex/config.toml"),
      notes: err.message,
    });
  }

  // Summary output
  console.log("┌─────────────────────┬──────────────────┬────────────────────────────────────────────┐");
  console.log("│ Agent               │ Status           │ Config Location                            │");
  console.log("├─────────────────────┼──────────────────┼────────────────────────────────────────────┤");
  for (const r of results) {
    const statusText =
      r.status === "installed"
        ? "\x1b[32m✔ installed\x1b[0m"
        : r.status === "updated"
        ? "\x1b[33m↻ updated\x1b[0m"
        : r.status === "already_configured"
        ? "\x1b[36m✔ active\x1b[0m"
        : "\x1b[90m- skipped\x1b[0m";
    const agentPadded = r.target.padEnd(19);
    const pathTrunc = r.path.length > 42 ? "..." + r.path.slice(-39) : r.path.padEnd(42);
    console.log(`│ ${agentPadded} │ ${statusText.padEnd(25)} │ ${pathTrunc} │`);
  }
  console.log("└─────────────────────┴──────────────────┴────────────────────────────────────────────┘\n");

  console.log("✨ \x1b[32mMegaPad MCP is ready!\x1b[0m\n");
  console.log("Try these commands inside Claude Code, Cursor, or Codex CLI:");
  console.log("  • \x1b[1m\"Run Claude and ChatGPT side-by-side to solve this bug\"\x1b[0m");
  console.log("  • \x1b[1m\"Ask DeepSeek R1 for a second opinion on this algorithm\"\x1b[0m");
  console.log("  • \x1b[1m\"Run a multi-model code review council on this file\"\x1b[0m\n");

  return results;
}
