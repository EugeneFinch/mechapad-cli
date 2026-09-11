<div align="center">

# ⚡ MegaPad CLI &amp; Native MCP Server

### Run Claude &amp; ChatGPT Side-by-Side with Zero API Keys

**Scientific Multi-Model Benchmarking, Instant Diff Inspection &amp; Native MCP Server for Claude Code, Cursor, and Terminal.**

[![GitHub Stars](https://img.shields.io/github/stars/EugeneFinch/mechapad-cli?style=social)](https://github.com/EugeneFinch/mechapad-cli)
[![npm version](https://img.shields.io/npm/v/megapad.svg)](https://www.npmjs.com/package/megapad)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-brightgreen.svg)](https://nodejs.org/)
[![Claude Code](https://img.shields.io/badge/Claude_Code-supported-blueviolet.svg)](#-claude-code--cursor-integration)
[![Cursor](https://img.shields.io/badge/Cursor-supported-blueviolet.svg)](#-claude-code--cursor-integration)
[![MegaPad MCP server – quality and maintenance score on Glama](https://glama.ai/mcp/servers/EugeneFinch/mechapad-cli/badges/score.svg)](https://glama.ai/mcp/servers/EugeneFinch/mechapad-cli)

[Quickstart](#-quickstart) · [See It in Action](#-see-it-in-action) · [Interactive Actions](#-interactive-post-duel-actions) · [Native MCP](#-claude-code--cursor-integration) · [Zero-Key Auth](#-zero-key-local-session-bridge) · [Contributing](#-contributing)

</div>

---

## ⚡ What is MegaPad?

Stop copy-pasting code between browser tabs. MegaPad automatically bridges your existing **Claude Code**, **ChatGPT Plus / Codex**, and **Grok CLI** logins into one unified local control plane.

- **Run Frontier Models in Parallel:** Race Claude, GPT-6 Astra, DeepSeek V4.1, Grok, and Gemini on the same prompt.
- **Zero API Keys Needed:** Auto-detects and bridges your active flat-rate subscriptions on disk. No metered API charges.
- **Interactive 1-Keystroke Actions:** Copy the winner's code to your clipboard (`[1]` or `[2]`), inspect a colored terminal diff (`[D]`), or write directly to a file (`[W]`).
- **Native MCP Server:** Turn Claude Code and Cursor into multi-model agents that automatically consult rival models over stdio.

---

## 🖥️ See It in Action

Run a 1-on-1 head-to-head race:

```bash
pad vs openai "Write a lock-free ring buffer in Rust"
```

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  megapad — head-to-head duel · PARALLEL EXECUTION                                      │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ $ pad vs openai "Write a lock-free ring buffer in Rust"                                │
│                                                                                        │
│ ⚡ Claude Fable 5.1 (1,140ms · 110 tok/s)    ⚡ OpenAI GPT-6 Astra (1,020ms · 130 tok/s)│
│ ───────────────────────────────────────     ────────────────────────────────────────── │
│ pub struct RingBuffer<T> {                  pub struct LockFreeQueue<T> {              │
│     buffer: Box<[UnsafeCell<T>]>,               buffer: Vec<AtomicPtr<T>>,             │
│     head: AtomicUsize,                          read_idx: CachePadded<AtomicUsize>,    │
│     tail: AtomicUsize,                          write_idx: CachePadded<AtomicUsize>,   │
│ }                                           }                                          │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Telemetry: GPT-6 Astra was 120ms faster (130 vs 110 tok/s). Total Cost: $0.00000       │
│                                                                                        │
│ ⚡ ACTIONS (100% offline · 0 additional tokens):                                        │
│   [1] Copy Claude code to clipboard   [D] View colored unified diff                     │
│   [2] Copy OpenAI code to clipboard   [W] Write winning code to file                    │
│   [Q / Enter] Done (exit)                                                              │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Quickstart

### 1. Install Globally or Run with NPX
```bash
npm install -g megapad

# Or zero-install via npx:
npx megapad "How do I optimize this Postgres query?"
```

### 2. Verify Your Connected Sessions
```bash
pad status
```
```text
🔑 MEGAPAD CONNECTED SESSIONS & ZERO-KEY FRONTIER MODELS
✔ Claude Code: (~/.claude.json) · Active: Claude Fable 5.1
✔ Codex / ChatGPT: (~/.codex/auth.json) · Active: GPT-6 Astra
✔ Grok CLI: (~/.grok/auth.json) · Active: Grok 4.6
⚡ Google Gemini: (Google Cloud Free Tier) · Active: Gemini 3.8 Flash
```

### 3. Run Duels, Races & Peer Reviews
```bash
# Head-to-head duel (Claude vs Target):
pad vs openai "Implement an atomic rate limiter"
pad vs grok "Find edge-case race conditions in this concurrency loop"
pad vs deepseek "Refactor this callback hell to async/await"

# Multi-model parallel race across all engines:
pad "How do I fix memory leaks in Node.js event emitters?"

# Peer code review council of staged git changes:
git diff --staged | pad review
```

---

## 🎮 Interactive Post-Duel Actions (Zero Extra Tokens)

After every race, MegaPad lets you take action with **1 keystroke**:

- **`[1]` or `[2]` (Copy Code to Clipboard):** Automatically strips conversational markdown fluff, extracts the core implementation, and places it straight on your clipboard (`pbcopy` / `clip` / `wl-copy`). Ready to `Cmd+V` into your editor.
- **`[D]` (Colored Unified Diff):** Computes a git-style line diff (`+` green / `-` red) directly in your terminal so you can immediately see the architectural trade-offs.
- **`[W]` (Write to File):** Enter a destination path (e.g. `src/buffer.rs`) to write the winning solution directly to disk.
- **`[Q / Enter]`:** Exits cleanly. Automatically skips prompting when running in pipes or scripts.

---

## 🤖 Claude Code &amp; Cursor Integration (Native MCP)

Turn your AI coding agent into a multi-model orchestrator.

### 1-Click Auto Configurator
```bash
pad install
# or via npx:
npx mechapad install
```
*Auto-detects and configures Claude Code (`~/.claude.json`), Cursor (`~/.cursor/mcp.json`), and Codex CLI.*

### MCP Tools Provided:
- **`megapad_compare`**: Ask multiple frontier models the same prompt in parallel and return structured benchmark metrics.
- **`megapad_consult_peer`**: Ask a rival model (e.g. GPT-6 or Grok) for an immediate second opinion when Claude gets stuck.
- **`megapad_council_code_review`**: Sends code or diffs to a multi-model council (OpenAI + DeepSeek) to catch edge-case bugs and security vulnerabilities.

---

## 🔑 Zero-Key Local Session Bridge

MegaPad never asks you to paste paid API keys:

1. **Local Disk Credentials:** Reads existing authorized CLI session credentials from `~/.claude.json`, `~/.codex/auth.json`, and `~/.grok/auth.json`.
2. **100% Local Stdio:** Runs on `localhost` over standard stdio. No telemetry, no third-party proxies, zero code leaves your machine.
3. **No Token Double-Billing:** Queries execute through your existing flat-rate subscriptions (ChatGPT Plus, Claude Pro, Grok). Routine tasks route to Gemini Flash (100% free forever) or DeepSeek for pennies.

---

## 📊 Scientific Benchmark Telemetry

Every query returns live, high-precision latency, tokens per second, and estimated cost:

| Provider / Model | Status | Latency | Speed | Per-Query Cost | vs Claude Cost |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **DeepSeek V4.1 Flash** | ✔ OK | 689ms | 185 tok/s | $0.00010 | ⚡ **97% Cheaper** |
| **Gemini 3.8 Flash** | ✔ OK | 940ms | 145 tok/s | $0.00000 | 🎉 **100% Free ($0)** |
| **ChatGPT (Codex Sub)** | ✔ OK | 1,020ms | 130 tok/s | $0.00000 | 🎉 **$0 Extra (Sub)** |
| **Claude Fable 5.1 / Sonnet 5** | ✔ OK | 1,140ms | 110 tok/s | $0.00000 | **$0 Extra (Sub)** |
| **Grok 4.6 / Build** | ✔ OK | 1,620ms | 69 tok/s | $0.00000 | **$0 Extra (Sub)** |

---

## 🤝 Contributing

We welcome community contributions! Want to add a new model provider (Ollama, Qwen, Mistral, Bedrock) or support a new IDE?
Check out our [Contributing Guide](./CONTRIBUTING.md) to get started in 10 minutes.

### Good First Issues
Check out [issues with the `good first issue` label](https://github.com/EugeneFinch/mechapad-cli/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) to contribute!

---

## 📈 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=EugeneFinch/mechapad-cli&type=Date)](https://star-history.com/#EugeneFinch/mechapad-cli&Date)

---

## 📄 License

[MIT](./LICENSE) © Eugene Finch &amp; MegaPad Contributors
