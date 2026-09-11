<div align="center">

# ⚡ Mechapad CLI & Native MCP Server

### Run Claude, ChatGPT, DeepSeek & Gemini in Parallel

**Scientific Multi-Model Benchmarking & Token Cost Slasher for Claude Code, Cursor, and Terminal.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/mechapad.svg)](https://www.npmjs.com/package/mechapad)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-brightgreen.svg)](https://nodejs.org/)
[![Claude Code](https://img.shields.io/badge/Claude_Code-supported-blue.svg)](#-claude-code--cursor-integration)
[![Cursor](https://img.shields.io/badge/Cursor-supported-blue.svg)](#-claude-code--cursor-integration)

[Quickstart](#-quickstart) · [Token & Cost Analytics](#-scientific-benchmarks) · [Claude Code / Cursor](#-claude-code--cursor-integration) · [Piping Support](#-pipe-any-input)

</div>

---

## ⚡ Quickstart

Run a multi-model comparison on any coding problem in **one command** (no install required):

```bash
npx mechapad compare "How do I optimize this query?"
```

*Executes across your available models in parallel and displays latency, generation speed (tok/s), exact token metrics, and cost savings vs Claude.*

---

## 🤖 Claude Code & Cursor Integration

Add Mechapad directly into your AI coding agent as a **Native Model Context Protocol (MCP) server**:

### 1-Click Auto Configurator
```bash
npx mechapad install
```
*Auto-detects and writes config for Claude Code (`~/.claude.json`), Cursor (`~/.cursor/mcp.json`), and Codex CLI (`~/.codex/config.toml`).*

### Or Add Directly to Claude Code
```bash
claude mcp add mechapad -- npx -y mechapad
```

### Try These Inside Claude:
- `"Compare Claude vs DeepSeek on this algorithm"`
- `"Consult DeepSeek R1 for a second opinion on this database schema"`
- `"Run a multi-model code review council on this file"`

---

## 📊 Scientific Benchmarks

Every query gives you high-resolution latency, tokens per second, and dollar cost comparisons:

| Provider / Model | Status | Latency | Speed | Cost (USD) | vs Claude Cost |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **DeepSeek R1 / V3** | ✔ OK | 1,051ms | 157 tok/s | $0.00012 | ⚡ **98% Cheaper** |
| **Gemini 2.5 Flash** | ✔ OK | 1,695ms | 98 tok/s | $0.00000 | 🎉 **100% Free ($0)** |
| **ChatGPT (Subscription)** | ✔ OK | 980ms | 110 tok/s | $0.00000 | 🎉 **$0 Extra (Sub)** |
| **OpenAI GPT-4o** | ✔ OK | 1,120ms | 120 tok/s | $0.00369 | ⚡ 31% Cheaper |
| **Claude 3.7 Sonnet** | ✔ OK | 1,240ms | 95 tok/s | $0.00537 | Base (100%) |

---

## 🛠️ Pipe Any Input

Pipe terminal output, compiler errors, or git diffs directly into Mechapad:

```bash
# Diagnose error logs across multiple models
cat error.log | npx mechapad "Diagnose this failure"

# Multi-model review of your git staging
git diff --staged | npx mechapad "Review these changes for race conditions"
```

---

## 🔑 Subscriptions & API Keys

Mechapad automatically detects your existing CLI subscriptions and local environment keys:

- **ChatGPT / OpenAI**: Reads your local Codex login session or `OPENAI_API_KEY`.
- **Claude**: Uses your active Claude Code session or `ANTHROPIC_API_KEY`.
- **DeepSeek**: Reads `DEEPSEEK_API_KEY` (from environment or `~/.env`).
- **Gemini**: Free tier quota (15 RPM free forever) or `GEMINI_API_KEY`.
- **Local Models**: Connects to local Ollama / LM Studio on `http://localhost:11434`.

---

## 📄 License

[MIT](./LICENSE) © Eugene Finch & Mechapad Contributors
