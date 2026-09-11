<div align="center">

# ⚡ MegaPad CLI & Native MCP Server

### Run Claude, ChatGPT, DeepSeek & Gemini in Parallel

**Scientific Multi-Model Benchmarking & Token Cost Slasher for Claude Code, Cursor, and Terminal.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/megapad.svg)](https://www.npmjs.com/package/megapad)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-brightgreen.svg)](https://nodejs.org/)
[![Claude Code](https://img.shields.io/badge/Claude_Code-supported-blue.svg)](#-claude-code--cursor-integration)
[![Cursor](https://img.shields.io/badge/Cursor-supported-blue.svg)](#-claude-code--cursor-integration)

[Quickstart](#-quickstart) · [Token & Cost Analytics](#-scientific-benchmarks) · [Claude Code / Cursor](#-claude-code--cursor-integration) · [Piping Support](#-pipe-any-input)

</div>

---

## ⚡ Quickstart

Run a multi-model race on any coding question in **one command**:

```bash
# Global / Local
pad "How do I optimize this query?"

# Or via npx (zero install)
npx megapad "How do I optimize this query?"
```

*Executes across your available models in parallel and displays latency, generation speed (tok/s), exact token metrics, and cost savings vs Claude.*

---

## 🤖 Claude Code & Cursor Integration

Add MegaPad into your AI coding agent as a **Native Model Context Protocol (MCP) server**:

### 1-Click Auto Configurator
```bash
pad install
```
*Auto-detects and writes config for Claude Code (`~/.claude.json`), Cursor (`~/.cursor/mcp.json`), and Codex CLI (`~/.codex/config.toml`).*

### Inside Claude Code (One Unified Slash Command)
Use the `/pad` slash command directly:
- `/pad "How do I optimize this query?"` — Instant multi-model race & telemetry
- `/pad review` — Multi-model code review council
- `/pad status` — Inspect connected accounts & model subscriptions

---

## 📊 Scientific Benchmarks

Every query gives you high-resolution latency, tokens per second, and dollar cost comparisons:

| Provider / Model | Status | Latency | Speed | Cost (USD) | vs Claude Cost |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **DeepSeek V4.1 Flash** | ✔ OK | 890ms | 185 tok/s | $0.00010 | ⚡ **98% Cheaper** |
| **Gemini 3.8 Flash** | ✔ OK | 940ms | 145 tok/s | $0.00000 | 🎉 **100% Free ($0)** |
| **ChatGPT (Subscription)** | ✔ OK | 820ms | 125 tok/s | $0.00000 | 🎉 **$0 Extra (Sub)** |
| **GPT-6 Astra / Sol** | ✔ OK | 1,020ms | 130 tok/s | $0.00280 | ⚡ 30% Cheaper |
| **Claude Fable 5.1 / Sonnet 5** | ✔ OK | 1,140ms | 110 tok/s | $0.00400 | Base (100%) |

---

## 🛠️ Pipe Any Input

Pipe terminal output, compiler errors, or git diffs directly into MegaPad:

```bash
# Diagnose error logs across multiple models
cat error.log | npx megapad "Diagnose this failure"

# Multi-model review of your git staging
git diff --staged | npx megapad "Review these changes for race conditions"
```

---

## 🔑 Subscriptions & API Keys

MegaPad automatically detects your existing CLI subscriptions and local environment keys:

- **ChatGPT / OpenAI**: Reads your local Codex login session or `OPENAI_API_KEY`.
- **Claude**: Uses your active Claude Code session or `ANTHROPIC_API_KEY`.
- **DeepSeek**: Reads `DEEPSEEK_API_KEY` (from environment or `~/.env`).
- **Gemini**: Free tier quota (15 RPM free forever) or `GEMINI_API_KEY`.
- **Local Models**: Connects to local Ollama / LM Studio on `http://localhost:11434`.

---

## 📄 License

[MIT](./LICENSE) © Eugene Finch & MegaPad Contributors
