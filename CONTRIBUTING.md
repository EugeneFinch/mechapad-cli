# Contributing to MegaPad CLI & Native MCP Server ⚡

Thank you for your interest in contributing to **MegaPad**! We welcome all contributions — from adding new AI model providers and improving IDE auto-configurators to bug fixes, documentation, and benchmark tests.

---

## 🚀 Quick Start for Contributors

### 1. Fork & Clone
```bash
git clone https://github.com/EugeneFinch/mechapad-cli.git
cd mechapad-cli
npm install
```

### 2. Build & Test Locally
MegaPad uses `esbuild` for instant compilation into a self-contained ESM executable:
```bash
# Build dist/index.js
npm run build

# Run against mock provider (no API keys needed for testing!)
node dist/index.js vs mock "Write a binary search in TypeScript"

# Inspect account readiness
node dist/index.js status
```

---

## 🧩 How to Add a New Model Provider (in 3 Steps)

MegaPad's architecture is modular. Every AI engine implements the simple `Provider` interface.

### Step 1: Create your provider in `src/providers/<name>.ts`
```typescript
export interface Provider {
  id: string;
  name: string;
  run(
    input: { prompt: string; effort?: string; system?: string; toolsMode?: string },
    onEvent: (event: { state: "thinking" | "done" | "error"; text?: string; detail?: string }) => void
  ): Promise<void>;
}

export const myNewProvider: Provider = {
  id: "my-model",
  name: "My New Model",
  async run(input, onEvent) {
    onEvent({ state: "thinking", detail: "generating..." });
    
    // Call your model endpoint or local daemon:
    const responseText = await fetchFromModel(input.prompt);
    
    onEvent({
      state: "done",
      text: responseText,
    });
  },
};
```

### Step 2: Register it in `src/engine.ts`
Add your provider to `createProviders()` and register its alias in `MODEL_ALIAS_MAP`:
```typescript
"my-model": "my-model",
"mymodel": "my-model",
```

### Step 3: Test and Submit
```bash
npm run build
node dist/index.js vs my-model "Test query"
```

---

## 🎯 Good First Issues
Check our [open issues with the `good first issue` label](https://github.com/EugeneFinch/mechapad-cli/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) for beginner-friendly tasks:
- Adding local Ollama / LM Studio streaming provider
- Supporting Qwen 2.5 Coder 32B or Mistral Codestral
- Auto-configuring Windsurf Cascade and Zed IDE MCP configs
- Writing integration test suites

---

## 📋 Pull Request Guidelines

1. **Keep it focused:** One feature or bug fix per PR.
2. **Offline-friendly:** Ensure the CLI still runs cleanly without crashing if a provider is offline or credentials are missing.
3. **Run the build:** Make sure `npm run build` passes with zero errors before opening your PR.

---

## 💬 Community & Help
- Star the repository to follow release updates!
- Open a GitHub Discussion or Issue if you have questions or want to propose a new architecture.
