# @agentpad/mcp (Mechapad Native MCP Server)

Official **Model Context Protocol (MCP)** server for multi-model parallel execution, side-by-side comparison, and peer council code reviews.

Run **Claude 3.7**, **OpenAI GPT-4o**, **DeepSeek R1**, and **Gemini 2.5** concurrently directly from **Claude Code**, **Claude Desktop**, **Cursor**, or any MCP-compatible environment.

---

## ⚡ Quick Setup

### 1. Claude Desktop Setup
Add the following to your `claude_desktop_config.json` (on macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "mechapad": {
      "command": "node",
      "args": ["/Users/eugene/Coding/Mechapad/packages/mcp/dist/index.js"],
      "env": {
        "OPENAI_API_KEY": "sk-...",
        "ANTHROPIC_API_KEY": "sk-ant-...",
        "DEEPSEEK_API_KEY": "sk-..."
      }
    }
  }
}
```

### 2. Claude Code Setup
Run in your project directory:
```bash
claude mcp add mechapad -- node /Users/eugene/Coding/Mechapad/packages/mcp/dist/index.js
```

---

## 🛠️ Exposed MCP Tools

### 1. `mechapad_compare`
Runs a prompt or coding question across multiple models in parallel and returns side-by-side responses with latency & token metrics.
- **`prompt`** *(string, required)*: The question or task to compare.
- **`models`** *(array, optional)*: `["claude", "openai", "deepseek", "gemini", "grok"]` (Defaults to `["claude", "openai"]`).

### 2. `mechapad_consult_peer`
Asks a specific peer AI model (e.g. DeepSeek R1 for logic/math or GPT-4o for syntax) a targeted question.
- **`model`** *(string, required)*: Model provider (`"deepseek"`, `"openai"`, `"claude"`, `"gemini"`, `"grok"`).
- **`prompt`** *(string, required)*: Query for the model.

### 3. `mechapad_council_code_review`
Sends code to a peer council (DeepSeek R1 + GPT-4o) to detect subtle bugs, edge cases, and performance optimizations.
- **`code`** *(string, required)*: Code snippet to review.
- **`context`** *(string, optional)*: Requirements or constraints.
- **`reviewer_models`** *(array, optional)*: Models to review (Defaults to `["openai", "deepseek"]`).

### 4. `mechapad_list_models`
Returns all configured and ready model providers.

---

## 🔑 Authentication / API Keys
Mechapad MCP automatically reads API keys from:
- System environment variables (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `DEEPSEEK_API_KEY`, `GEMINI_API_KEY`, `XAI_API_KEY`)
- Local `.env` file in the workspace
- User keychain / `~/.agentpad/secrets.json`
