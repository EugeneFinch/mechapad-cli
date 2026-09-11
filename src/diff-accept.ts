import { spawnSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import * as readline from "node:readline";
import type { BenchmarkMetrics } from "./cli-compare.js";

/**
 * Extracts the primary/longest code block from markdown fenced code,
 * or returns the raw text if no code blocks are found.
 */
export function extractCodeBlock(text: string): string {
  const regex = /```(?:[a-zA-Z0-9_\-\.\+]*)\n([\s\S]*?)```/g;
  const matches = Array.from(text.matchAll(regex));
  if (matches.length > 0) {
    let longest = matches[0][1];
    for (const m of matches) {
      if (m[1].length > longest.length) {
        longest = m[1];
      }
    }
    return longest.trim();
  }
  return text.trim();
}

/**
 * Copies text to system clipboard (macOS, Windows, Linux).
 * 100% local, zero tokens, zero network requests.
 */
export function copyToClipboard(text: string): boolean {
  try {
    const platform = process.platform;
    if (platform === "darwin") {
      const proc = spawnSync("pbcopy", [], { input: text, encoding: "utf8" });
      return proc.status === 0;
    } else if (platform === "win32") {
      const proc = spawnSync("clip", [], { input: text, encoding: "utf8" });
      return proc.status === 0;
    } else {
      const linuxTools: [string, string[]][] = [
        ["wl-copy", []],
        ["xclip", ["-selection", "clipboard"]],
        ["xsel", ["-b"]],
      ];
      for (const [bin, args] of linuxTools) {
        try {
          const proc = spawnSync(bin, args, { input: text, encoding: "utf8" });
          if (proc.status === 0) return true;
        } catch {
          // try next
        }
      }
    }
  } catch {
    return false;
  }
  return false;
}

/**
 * Computes Longest Common Subsequence line diff between two arrays of strings.
 */
export function computeLcsDiff(
  linesA: string[],
  linesB: string[],
): { type: "common" | "removed" | "added"; line: string }[] {
  const n = linesA.length;
  const m = linesB.length;

  if (n > 800 || m > 800) {
    const out: { type: "common" | "removed" | "added"; line: string }[] = [];
    for (const l of linesA) out.push({ type: "removed", line: l });
    for (const l of linesB) out.push({ type: "added", line: l });
    return out;
  }

  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      if (linesA[i] === linesB[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const diff: { type: "common" | "removed" | "added"; line: string }[] = [];
  let i = n;
  let j = m;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && linesA[i - 1] === linesB[j - 1]) {
      diff.unshift({ type: "common", line: linesA[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diff.unshift({ type: "added", line: linesB[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      diff.unshift({ type: "removed", line: linesA[i - 1] });
      i--;
    }
  }

  return diff;
}

/**
 * Formats a colored git-style unified diff between two code implementations.
 */
export function formatColoredDiff(
  nameA: string,
  codeA: string,
  nameB: string,
  codeB: string,
): string {
  const linesA = codeA.split(/\r?\n/);
  const linesB = codeB.split(/\r?\n/);
  const diff = computeLcsDiff(linesA, linesB);

  let output = `\n\x1b[1m--- [1] ${nameA}\x1b[0m\n`;
  output += `\x1b[1m+++ [2] ${nameB}\x1b[0m\n`;
  output += `\x1b[90m──────────────────────────────────────────────────────────────────────────\x1b[0m\n`;

  let addedCount = 0;
  let removedCount = 0;

  for (const item of diff) {
    if (item.type === "added") {
      addedCount++;
      output += `\x1b[32m+ ${item.line}\x1b[0m\n`;
    } else if (item.type === "removed") {
      removedCount++;
      output += `\x1b[31m- ${item.line}\x1b[0m\n`;
    } else {
      output += `\x1b[90m  ${item.line}\x1b[0m\n`;
    }
  }

  output += `\x1b[90m──────────────────────────────────────────────────────────────────────────\x1b[0m\n`;
  output += `\x1b[90mDiff summary: \x1b[32m+${addedCount}\x1b[0m / \x1b[31m-${removedCount}\x1b[0m lines\x1b[0m\n`;

  return output;
}

/**
 * Writes code to a file path, ensuring parent directories exist.
 */
export function writeCodeToFile(targetPath: string, content: string): string {
  const fullPath = resolve(process.cwd(), targetPath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content, "utf8");
  return fullPath;
}

function promptQuestion(rl: readline.Interface, query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer.trim());
    });
  });
}

/**
 * Runs an interactive post-benchmark action prompt.
 * Lets developers copy code to clipboard, inspect diffs, or write to file.
 */
export async function runInteractiveActionPrompt(
  results: BenchmarkMetrics[],
): Promise<void> {
  // Only prompt in interactive TTY terminals
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return;
  }

  const successful = results.filter((r) => r.success && r.text.trim());
  if (successful.length === 0) {
    return;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    let keepRunning = true;

    while (keepRunning) {
      console.log("──────────────────────────────────────────────────────────────────────────────────────────");
      console.log(" ⚡ \x1b[1m\x1b[36mACTIONS\x1b[0m (100% offline · 0 additional tokens)");
      console.log("──────────────────────────────────────────────────────────────────────────────────────────");

      for (let idx = 0; idx < successful.length; idx++) {
        const item = successful[idx]!;
        console.log(`  \x1b[1m[${idx + 1}]\x1b[0m Copy \x1b[33m[${item.model}]\x1b[0m code to clipboard`);
      }

      if (successful.length >= 2) {
        console.log(`  \x1b[1m[D]\x1b[0m View colored side-by-side diff (\x1b[33m[${successful[0]!.model}]\x1b[0m vs \x1b[33m[${successful[1]!.model}]\x1b[0m)`);
      }

      console.log(`  \x1b[1m[W]\x1b[0m Write winning code to file`);
      console.log(`  \x1b[90m[Q / Enter] Done (exit)\x1b[0m`);
      console.log("──────────────────────────────────────────────────────────────────────────────────────────");

      const ans = await promptQuestion(rl, "👉 Select action: ");
      if (!ans || ans.toLowerCase() === "q" || ans.toLowerCase() === "exit") {
        keepRunning = false;
        break;
      }

      const num = parseInt(ans, 10);
      if (!isNaN(num) && num >= 1 && num <= successful.length) {
        const chosen = successful[num - 1]!;
        const code = extractCodeBlock(chosen.text);
        const ok = copyToClipboard(code);
        const lineCount = code.split(/\r?\n/).length;

        if (ok) {
          console.log(`\n\x1b[32m✔ Copied [${chosen.model}] code to clipboard! (${lineCount} lines)\x1b[0m`);
          console.log(`\x1b[90mTip: Paste directly with Cmd+V / Ctrl+V into your editor.\x1b[0m\n`);
        } else {
          console.log(`\n\x1b[33m⚠️ Could not write to system clipboard automatically.\x1b[0m\n`);
        }
        continue;
      }

      if (ans.toLowerCase() === "d" && successful.length >= 2) {
        const modA = successful[0]!;
        const modB = successful[1]!;
        const codeA = extractCodeBlock(modA.text);
        const codeB = extractCodeBlock(modB.text);

        console.log(formatColoredDiff(modA.model, codeA, modB.model, codeB));
        continue;
      }

      if (ans.toLowerCase() === "w") {
        let chosenIdx = 0;
        if (successful.length > 1) {
          const modAns = await promptQuestion(
            rl,
            `Which model's code to write? (1-${successful.length}, default 1): `,
          );
          const parsedIdx = parseInt(modAns, 10);
          if (!isNaN(parsedIdx) && parsedIdx >= 1 && parsedIdx <= successful.length) {
            chosenIdx = parsedIdx - 1;
          }
        }

        const chosen = successful[chosenIdx]!;
        const targetPath = await promptQuestion(
          rl,
          `Enter destination file path (e.g. src/solution.rs): `,
        );

        if (!targetPath) {
          console.log("\x1b[90mCancelled write.\x1b[0m\n");
          continue;
        }

        try {
          const code = extractCodeBlock(chosen.text);
          const writtenPath = writeCodeToFile(targetPath, code);
          const lineCount = code.split(/\r?\n/).length;
          console.log(`\n\x1b[32m✔ Successfully wrote [${chosen.model}] code to ${targetPath} (${lineCount} lines)\x1b[0m`);
          console.log(`\x1b[90mAbsolute: ${writtenPath}\x1b[0m\n`);
        } catch (err) {
          console.log(`\n\x1b[31m✖ Error writing file:\x1b[0m ${err instanceof Error ? err.message : String(err)}\n`);
        }
        continue;
      }

      console.log("\x1b[90mUnrecognized option. Try 1, 2, D, W, or Q.\x1b[0m\n");
    }
  } finally {
    rl.close();
  }
}
