#!/usr/bin/env node

// src/index.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";

// ../daemon/dist/providers/mock.js
var mockProvider = {
  id: "mock",
  name: "Mock Agent",
  async run(input, onEvent) {
    onEvent({ state: "thinking", detail: "planning\u2026" });
    await sleep(400);
    onEvent({ state: "thinking", detail: `effort=${input.effort}` });
    await sleep(600);
    const preview = input.prompt.slice(0, 48) || "(empty prompt)";
    onEvent({
      state: "done",
      detail: `mock ok: ${preview}${input.prompt.length > 48 ? "\u2026" : ""}`,
      text: `[mock @ ${input.effort}] ${input.prompt}`
    });
  }
};
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ../daemon/dist/tools.js
import { execFile as execFile2 } from "node:child_process";
import { existsSync as existsSync3, readFileSync as readFileSync3, readdirSync as readdirSync3, statSync as statSync3, writeFileSync, mkdirSync } from "node:fs";
import { dirname as dirname3, join as join3, relative, resolve as resolve3, sep } from "node:path";
import { promisify as promisify2 } from "node:util";

// ../daemon/dist/workspace.js
import { execFile } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
var execFileAsync = promisify(execFile);
function defaultRoot() {
  if (process.env.AGENTPAD_WORKSPACE) {
    return resolve(process.env.AGENTPAD_WORKSPACE);
  }
  const here = dirname(fileURLToPath(import.meta.url));
  const projectRoot2 = resolve(here, "../../..");
  if (existsSync(join(projectRoot2, "package.json")))
    return projectRoot2;
  return process.cwd();
}
function workspaceRoot() {
  return defaultRoot();
}

// ../daemon/dist/skills-loader.js
import { execFileSync } from "node:child_process";
import { existsSync as existsSync2, readdirSync as readdirSync2, readFileSync as readFileSync2, statSync as statSync2 } from "node:fs";
import { homedir } from "node:os";
import { dirname as dirname2, join as join2, resolve as resolve2 } from "node:path";
import { fileURLToPath as fileURLToPath2 } from "node:url";
function projectRoot() {
  const here = dirname2(fileURLToPath2(import.meta.url));
  const root = resolve2(here, "../../..");
  return existsSync2(join2(root, "package.json")) ? root : process.cwd();
}
function pushIfDir(out, p) {
  try {
    if (p && existsSync2(p) && statSync2(p).isDirectory())
      out.push(resolve2(p));
  } catch {
  }
}
function skillSearchRoots() {
  const home = homedir();
  const roots = [];
  const env = process.env.AGENTPAD_SKILLS_PATH;
  if (env) {
    for (const p of env.split(":").map((s) => s.trim()).filter(Boolean)) {
      pushIfDir(roots, p);
    }
  }
  pushIfDir(roots, join2(projectRoot(), ".agentpad", "skills"));
  pushIfDir(roots, join2(projectRoot(), "skills"));
  pushIfDir(roots, join2(home, ".hermes", "skills"));
  pushIfDir(roots, join2(home, ".hermes", "hermes-agent", "skills"));
  pushIfDir(roots, join2(home, ".openclaw", "skills"));
  pushIfDir(roots, join2(home, ".claw", "skills"));
  pushIfDir(roots, join2(home, ".claude", "skills"));
  pushIfDir(roots, join2(home, ".config", "claude", "skills"));
  pushIfDir(roots, join2(home, ".cursor", "skills"));
  pushIfDir(roots, join2(projectRoot(), ".claude", "skills"));
  pushIfDir(roots, join2(projectRoot(), ".cursor", "skills"));
  const nvmBase = join2(home, ".nvm", "versions", "node");
  if (existsSync2(nvmBase)) {
    try {
      for (const ver of readdirSync2(nvmBase)) {
        pushIfDir(roots, join2(nvmBase, ver, "lib", "node_modules", "openclaw", "skills"));
      }
    } catch {
    }
  }
  pushIfDir(roots, "/usr/local/lib/node_modules/openclaw/skills");
  pushIfDir(roots, join2(projectRoot(), "node_modules", "openclaw", "skills"));
  for (const hit of autoDiscoverSkillDirs()) {
    pushIfDir(roots, hit);
  }
  return [...new Set(roots)];
}
function autoDiscoverSkillDirs() {
  const home = homedir();
  const found = /* @__PURE__ */ new Set();
  const searchBases = [
    join2(home, ".hermes"),
    join2(home, ".openclaw"),
    join2(home, ".claude"),
    join2(home, ".cursor"),
    join2(home, ".config"),
    join2(home, ".local", "share"),
    projectRoot()
  ].filter((p) => existsSync2(p));
  for (const base of searchBases) {
    try {
      const out = execFileSync("find", [
        base,
        "-maxdepth",
        "6",
        "(",
        "-name",
        "node_modules",
        "-o",
        "-name",
        ".git",
        "-o",
        "-name",
        "dist",
        ")",
        "-prune",
        "-o",
        "-name",
        "SKILL.md",
        "-print"
      ], {
        encoding: "utf8",
        timeout: 4e3,
        maxBuffer: 2 * 1024 * 1024
      });
      for (const line of out.split("\n")) {
        const f = line.trim();
        if (!f)
          continue;
        const dir = dirname2(f);
        found.add(dir);
        const parent = dirname2(dir);
        if (parent && parent !== base) {
          if (/skills?$/i.test(parent.split(/[/\\]/).pop() || "")) {
            found.add(parent);
          }
        }
      }
    } catch {
    }
  }
  if (process.platform === "darwin") {
    try {
      const out = execFileSync("mdfind", ["kMDItemFSName == 'SKILL.md'", "-onlyin", home], { encoding: "utf8", timeout: 3e3, maxBuffer: 1024 * 1024 });
      let n = 0;
      for (const line of out.split("\n")) {
        if (n > 80)
          break;
        const f = line.trim();
        if (!f || f.includes("node_modules"))
          continue;
        found.add(dirname2(f));
        n++;
      }
    } catch {
    }
  }
  const roots = [];
  for (const d of found) {
    const base = d.split(/[/\\]/).pop() || "";
    if (/^skills?$/i.test(base))
      roots.push(d);
    else {
      let cur = d;
      for (let i = 0; i < 4; i++) {
        const name = cur.split(/[/\\]/).pop() || "";
        if (/^skills?$/i.test(name)) {
          roots.push(cur);
          break;
        }
        const parent = dirname2(cur);
        if (parent === cur)
          break;
        cur = parent;
      }
      roots.push(d);
    }
  }
  return [...new Set(roots)];
}
function walkSkillFiles(root, maxDepth = 6) {
  const out = [];
  function walk(dir, depth) {
    if (depth > maxDepth)
      return;
    let entries;
    try {
      entries = readdirSync2(dir);
    } catch {
      return;
    }
    for (const name of entries) {
      if (name === "node_modules" || name === ".git" || name === "dist")
        continue;
      const full = join2(dir, name);
      let st;
      try {
        st = statSync2(full);
      } catch {
        continue;
      }
      if (st.isDirectory())
        walk(full, depth + 1);
      else if (name === "SKILL.md" || name === "skill.md")
        out.push(full);
    }
  }
  walk(root, 0);
  return out;
}
function parseFrontmatter(raw) {
  if (!raw.startsWith("---")) {
    return { body: raw };
  }
  const end = raw.indexOf("\n---", 3);
  if (end === -1)
    return { body: raw };
  const fm = raw.slice(3, end).trim();
  const body = raw.slice(end + 4).replace(/^\s*\n/, "");
  let name;
  let description;
  for (const line of fm.split("\n")) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (!m)
      continue;
    const key = m[1];
    let val = m[2] ?? "";
    if (val.startsWith('"') && val.endsWith('"') || val.startsWith("'") && val.endsWith("'")) {
      val = val.slice(1, -1);
    }
    if (key === "name")
      name = val;
    if (key === "description")
      description = val;
  }
  if (!description) {
    const dm = fm.match(/description:\s*[>|]?\s*\n((?:\s+.+\n?)+)/);
    if (dm)
      description = dm[1].replace(/^\s+/gm, "").trim();
  }
  return { name, description, body };
}
function classifySource(root, path2) {
  const s = `${root} ${path2}`.toLowerCase();
  if (s.includes(".agentpad") || s.includes("/fafo/skills"))
    return "agentpad";
  if (s.includes("hermes"))
    return "hermes";
  if (s.includes(".claude"))
    return "claude";
  if (s.includes(".cursor"))
    return "cursor";
  if (s.includes("openclaw") || s.includes("/claw/"))
    return "openclaw";
  return "path";
}
var SOURCE_RANK = {
  agentpad: 100,
  hermes: 80,
  claude: 70,
  cursor: 60,
  path: 40,
  openclaw: 10
};
function sourceRank(source) {
  return SOURCE_RANK[source] ?? 30;
}
function preferSkill(a, b) {
  const ra = sourceRank(a.source);
  const rb = sourceRank(b.source);
  if (ra !== rb)
    return ra > rb ? a : b;
  return a.body.length <= b.body.length ? a : b;
}
var cache = null;
var cacheAt = 0;
var lastRoots = [];
function loadAllSkills(force = false) {
  const now = Date.now();
  if (!force && cache && now - cacheAt < 3e4)
    return cache;
  const byName = /* @__PURE__ */ new Map();
  lastRoots = skillSearchRoots();
  for (const root of lastRoots) {
    for (const path2 of walkSkillFiles(root)) {
      try {
        const raw = readFileSync2(path2, "utf8");
        const { name, description, body } = parseFrontmatter(raw);
        const folder = dirname2(path2).split(/[/\\]/).pop() || "skill";
        const skillName = (name || folder).toLowerCase().replace(/\s+/g, "-");
        const candidate = {
          name: skillName,
          description: description || "(no description)",
          body: body || raw,
          source: classifySource(root, path2),
          path: path2
        };
        const existing = byName.get(skillName);
        if (!existing) {
          byName.set(skillName, candidate);
        } else {
          byName.set(skillName, preferSkill(existing, candidate));
        }
      } catch {
      }
    }
  }
  cache = [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
  cacheAt = now;
  return cache;
}
function getSkill(name) {
  const key = name.toLowerCase().replace(/\s+/g, "-");
  const all = loadAllSkills();
  const exact = all.find((s) => s.name === key);
  if (exact)
    return exact;
  const fuzzy = all.filter((s) => s.name.includes(key) || key.includes(s.name)).sort((a, b) => sourceRank(b.source) - sourceRank(a.source));
  return fuzzy[0];
}
var QUERY_ALIASES = [
  {
    match: /google\s*sheet|gsheet|spreadsheet|sheets?\b/i,
    expand: ["gog", "sheets", "google", "workspace", "spreadsheet"]
  },
  {
    match: /gmail|google\s*mail|inbox/i,
    expand: ["gog", "gmail", "google", "email", "mail"]
  },
  {
    match: /google\s*drive|gdrive/i,
    expand: ["gog", "drive", "google", "workspace"]
  },
  {
    match: /google\s*calendar|gcal/i,
    expand: ["gog", "calendar", "google", "workspace"]
  },
  {
    match: /google\s*docs?|gdoc/i,
    expand: ["gog", "docs", "google", "workspace"]
  },
  {
    match: /google\s*workspace|g\s*suite|gsuite/i,
    expand: ["gog", "google", "workspace", "gmail", "sheets", "drive"]
  },
  {
    match: /\bgh\b|github|pull request|\bprs?\b|ci\b|actions/i,
    expand: ["github", "gh-issues", "gh", "pr", "pull", "review", "ci"]
  },
  {
    match: /slack/i,
    expand: ["slack", "message", "chat"]
  },
  {
    match: /notion/i,
    expand: ["notion"]
  },
  {
    match: /1password|1p\b|op\b.*vault/i,
    expand: ["1password", "password", "secret"]
  },
  {
    match: /linear\b|jira|ticket/i,
    expand: ["linear", "jira", "issue", "ticket"]
  }
];
function expandQuery(query) {
  const raw = query.toLowerCase().trim();
  const aliases = [];
  for (const rule of QUERY_ALIASES) {
    if (rule.match.test(raw))
      aliases.push(...rule.expand);
  }
  const tokens = raw.split(/[^a-z0-9+#.]+/i).map((t) => t.toLowerCase()).filter((t) => t.length > 1 && !STOP.has(t));
  const allTokens = [.../* @__PURE__ */ new Set([...tokens, ...aliases.map((a) => a.toLowerCase())])];
  return { raw, tokens: allTokens, aliases: [...new Set(aliases)] };
}
var STOP = /* @__PURE__ */ new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "for",
  "to",
  "of",
  "in",
  "on",
  "with",
  "my",
  "me",
  "i",
  "want",
  "need",
  "like",
  "use",
  "using",
  "integration",
  "integrate",
  "connect",
  "setup",
  "set",
  "up",
  "please",
  "some",
  "into",
  "from",
  "that",
  "this",
  "how",
  "can",
  "do"
]);
function findSkillsFor(query, limit = 12) {
  const { raw, tokens, aliases } = expandQuery(query);
  if (!raw)
    return loadAllSkills().slice(0, limit);
  const scored = loadAllSkills().map((s) => {
    const name = s.name.toLowerCase();
    const desc = s.description.toLowerCase();
    const hay = `${name} ${desc} ${s.body.slice(0, 2e3)}`.toLowerCase();
    let score = 0;
    if (name === raw)
      score += 80;
    if (name.includes(raw.replace(/\s+/g, "-")))
      score += 40;
    if (desc.includes(raw))
      score += 35;
    for (const a of aliases) {
      if (name === a)
        score += 100;
      else if (name.includes(a) || a.includes(name))
        score += 50;
      if (desc.includes(a))
        score += 25;
      if (hay.includes(a))
        score += 8;
    }
    for (const t of tokens) {
      if (name === t)
        score += 40;
      else if (name.includes(t))
        score += 18;
      if (desc.includes(t))
        score += 12;
      if (hay.includes(t))
        score += 3;
    }
    const meaningful = tokens.filter((t) => t.length > 2);
    if (meaningful.length >= 2) {
      const hits = meaningful.filter((t) => hay.includes(t)).length;
      if (hits >= 2)
        score += 20 * hits;
    }
    if (/google|sheet|gmail|drive|calendar|docs/.test(raw) && /gog|google|sheet|gmail|drive|workspace/.test(hay)) {
      score += 20;
    }
    score += Math.round(sourceRank(s.source) / 10);
    if (s.source === "openclaw")
      score -= 15;
    return { ...s, score };
  });
  return scored.filter((s) => (s.score ?? 0) >= 12).sort((a, b) => {
    const ds = (b.score ?? 0) - (a.score ?? 0);
    if (ds !== 0)
      return ds;
    return sourceRank(b.source) - sourceRank(a.source);
  }).slice(0, limit);
}

// ../daemon/dist/tools.js
var execFileAsync2 = promisify2(execFile2);
var TOOL_SPECS = [
  {
    type: "function",
    function: {
      name: "read_file",
      description: "Read a text file under the workspace root.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Relative path from workspace root" },
          max_bytes: { type: "number", description: "Max bytes (default 30000)" }
        },
        required: ["path"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_dir",
      description: "List files/dirs under a workspace path.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Relative dir (default .)" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "git",
      description: "Run a read-only git command (status, diff, log, show, branch, rev-parse). No push/commit/reset.",
      parameters: {
        type: "object",
        properties: {
          args: {
            type: "array",
            items: { type: "string" },
            description: 'e.g. ["diff","--stat"] or ["log","-5","--oneline"]'
          }
        },
        required: ["args"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "run_shell",
      description: "Run a shell command (like OpenClaw terminal). Use for skill setup: which, brew install, gog, gh, npm. Timeout 90s for brew, 25s otherwise. Not for interactive OAuth browsers.",
      parameters: {
        type: "object",
        properties: {
          command: { type: "string", description: "Shell command string" }
        },
        required: ["command"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "write_file",
      description: "Write a text file under the workspace (creates parent dirs). Use for patches/docs the user can apply.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string" },
          content: { type: "string" }
        },
        required: ["path", "content"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_skills",
      description: "List or search skills auto-discovered from OpenClaw/Hermes/Claude/Cursor/.agentpad.",
      parameters: {
        type: "object",
        properties: {
          filter: {
            type: "string",
            description: "Substring filter on name/description"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "find_skills",
      description: "Find the best skills for a task description (ranked). Prefer this when user asks what skill to use.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "What the user wants to do, e.g. review github PR, run tests"
          }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "load_skill",
      description: "Load full SKILL.md body for a skill by name. Use after find_skills/list_skills.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Skill name e.g. github, coding-agent, gh-issues"
          }
        },
        required: ["name"]
      }
    }
  }
];
function safeResolve(root, rel) {
  const cleaned = rel.replace(/^\/+/, "");
  if (cleaned.includes("\0"))
    return null;
  const abs = resolve3(root, cleaned);
  const relTo = relative(root, abs);
  if (relTo.startsWith("..") || relTo === "..")
    return null;
  if (relTo.split(sep).includes(".."))
    return null;
  return abs;
}
var GIT_DENY = /^(push|commit|reset|clean|checkout|merge|rebase|cherry-pick|add|rm|mv|tag|stash|config|filter-branch|remote)/i;
var SHELL_DENY = /\b(rm\s+-rf|mkfs|dd\s+if=|>\s*\/dev\/|shutdown|reboot|curl\s+[^\n]*\|\s*(ba)?sh|wget\s+[^\n]*\|\s*(ba)?sh)\b/i;
function shellAuthHint(command, blob, isError = false) {
  const isGog = /\bgog\b/i.test(command);
  const isGh = /\bgh\b/i.test(command);
  if (/deleted_client|invalid_client|unauthorized_client/i.test(blob)) {
    return [
      "",
      "",
      "[agentpad] OAuth client is invalid/deleted. STOP retrying API calls.",
      "User must re-register credentials, then re-auth (browser):",
      "  1) Download Desktop OAuth client JSON from Google Cloud Console",
      "  2) gog auth credentials /path/to/client_secret.json",
      "  3) gog auth add you@gmail.com --services gmail,calendar,drive,contacts,docs,sheets",
      "  4) gog auth list -j",
      "Give the user those exact commands. Do not invent success."
    ].join("\n");
  }
  if (isGog && isError && /insufficient|permission|scope|access.?denied|invalid_grant|token.*(revoked|expired)|deleted_client/i.test(blob)) {
    return [
      "",
      "",
      "[agentpad] gog auth missing scopes or token expired. STOP retries.",
      "User one-liner (browser):",
      "  gog auth add you@gmail.com --services gmail,drive,sheets,docs --force-consent",
      "Then: gog auth list -j"
    ].join("\n");
  }
  if (isGh && isError && /not logged|auth login|HTTP 401|Bad credentials/i.test(blob)) {
    return [
      "",
      "",
      "[agentpad] gh not authenticated. User must run (browser):",
      "  gh auth login",
      "Then re-check: gh auth status"
    ].join("\n");
  }
  if (isError && /requires? (a )?browser|open (the )?browser|device.?code|please log in|not logged in|tty|interactive.*required|no.?input.*fail/i.test(blob)) {
    return [
      "",
      "",
      "[agentpad] Interactive auth required. Print exact commands for the user to run in their own terminal, then re-check with run_shell. Do not loop the same failing call."
    ].join("\n");
  }
  return "";
}
async function runTool(name, argsJson) {
  const root = workspaceRoot();
  let args = {};
  try {
    args = JSON.parse(argsJson || "{}");
  } catch {
    return "error: invalid JSON args";
  }
  try {
    switch (name) {
      case "read_file": {
        const p = String(args.path ?? "");
        const abs = safeResolve(root, p);
        if (!abs)
          return "error: path outside workspace";
        if (!existsSync3(abs))
          return `error: not found: ${p}`;
        const max = Number(args.max_bytes) > 0 ? Number(args.max_bytes) : 3e4;
        const buf = readFileSync3(abs);
        const text = buf.slice(0, max).toString("utf8");
        const more = buf.length > max ? `
\u2026(+${buf.length - max} bytes)` : "";
        return text + more;
      }
      case "list_dir": {
        const p = String(args.path ?? ".");
        const abs = safeResolve(root, p);
        if (!abs)
          return "error: path outside workspace";
        if (!existsSync3(abs))
          return `error: not found: ${p}`;
        const names = readdirSync3(abs).slice(0, 200);
        return names.map((n) => {
          try {
            const st = statSync3(join3(abs, n));
            return `${st.isDirectory() ? "d" : "f"} ${n}`;
          } catch {
            return `? ${n}`;
          }
        }).join("\n");
      }
      case "git": {
        const gitArgs = args.args;
        if (!Array.isArray(gitArgs) || !gitArgs.length) {
          return "error: args required";
        }
        const head = String(gitArgs[0] ?? "");
        if (GIT_DENY.test(head)) {
          return `error: git ${head} not allowed (read-only tools)`;
        }
        const strArgs = gitArgs.map(String);
        const { stdout, stderr } = await execFileAsync2("git", strArgs, {
          cwd: root,
          timeout: 15e3,
          maxBuffer: 2 * 1024 * 1024,
          env: { ...process.env, GIT_TERMINAL_PROMPT: "0" }
        });
        const out = (stdout?.toString() || "") + (stderr?.toString() || "");
        return out.length > 4e4 ? out.slice(0, 4e4) + "\n\u2026truncated" : out || "(empty)";
      }
      case "run_shell": {
        const command = String(args.command ?? "").trim();
        if (!command)
          return "error: empty command";
        if (SHELL_DENY.test(command))
          return "error: command blocked by policy";
        if (/\bgog\s+auth\s+add\b/i.test(command) || /\bgh\s+auth\s+login\b/i.test(command)) {
          return [
            "error: interactive browser OAuth cannot run inside AgentPad.",
            "[agentpad] STOP tools. Give the user this exact command to run in their own terminal:",
            `  ${command.replace(/\s+--no-input\b/gi, "").trim()}`,
            "After they finish, re-check with: gog auth list -j   (or gh auth status)"
          ].join("\n");
        }
        const long = /\b(brew|npm i|npm install|pnpm (add|i|install)|pip install|cargo install)\b/i.test(command);
        const timeout = long ? 12e4 : 3e4;
        try {
          const { stdout, stderr } = await execFileAsync2("/bin/zsh", ["-lc", command], {
            cwd: root,
            timeout,
            maxBuffer: 4 * 1024 * 1024,
            env: {
              ...process.env,
              // help non-interactive tools
              CI: process.env.CI ?? "1",
              HOME: process.env.HOME,
              PATH: process.env.PATH
            }
          });
          const out = (stdout?.toString() || "") + (stderr?.toString() ? `
STDERR:
${stderr}` : "");
          const softHint = shellAuthHint(command, out, false);
          const full = (out || "(empty)") + softHint;
          return full.length > 4e4 ? full.slice(0, 4e4) + "\n\u2026truncated" : full;
        } catch (e) {
          const err = e;
          const stdout = err.stdout?.toString?.() ?? String(err.stdout ?? "");
          const stderr = err.stderr?.toString?.() ?? String(err.stderr ?? "");
          const msg = err.message ?? String(e);
          const blob = `${msg}
${stdout}
${stderr}`;
          const hint = shellAuthHint(command, blob, true);
          return `error (exit ${err.code ?? "?"}): ${msg.slice(0, 300)}
${stdout}
${stderr}${hint}`.slice(0, 4e4);
        }
      }
      case "write_file": {
        const p = String(args.path ?? "");
        const content = String(args.content ?? "");
        const abs = safeResolve(root, p);
        if (!abs)
          return "error: path outside workspace";
        if (p.includes(".agentpad/secrets") || p.endsWith("secrets.json")) {
          return "error: cannot write secrets";
        }
        mkdirSync(dirname3(abs), { recursive: true });
        writeFileSync(abs, content, "utf8");
        return `ok wrote ${p} (${content.length} bytes)`;
      }
      case "list_skills": {
        const filter = String(args.filter ?? "").toLowerCase().trim();
        let skills = loadAllSkills();
        if (filter) {
          skills = skills.filter((s) => s.name.includes(filter) || s.description.toLowerCase().includes(filter));
        }
        if (!skills.length)
          return "No skills found.";
        return skills.slice(0, 80).map((s) => `${s.name} [${s.source}] \u2014 ${s.description}`).join("\n");
      }
      case "find_skills": {
        const query = String(args.query ?? "").trim();
        if (!query)
          return "error: query required";
        const hits = findSkillsFor(query, 12);
        if (!hits.length)
          return `No skills matched: ${query}`;
        return hits.map((s) => `${s.name} [${s.source}] score=${s.score} \u2014 ${s.description}`).join("\n");
      }
      case "load_skill": {
        const skillName = String(args.name ?? "").trim();
        if (!skillName)
          return "error: name required";
        const skill = getSkill(skillName);
        if (!skill) {
          const names = loadAllSkills().map((s) => s.name).slice(0, 30).join(", ");
          return `error: skill not found: ${skillName}. Try: ${names}`;
        }
        const body = skill.body.length > 5e4 ? skill.body.slice(0, 5e4) + "\n\u2026truncated" : skill.body;
        return [
          `# Skill: ${skill.name} [${skill.source}]`,
          `path: ${skill.path}`,
          "",
          body,
          "",
          "## AgentPad setup protocol",
          "You have run_shell. Follow this skill by RUNNING commands, not only describing them.",
          "1) Check if required CLIs exist (which / brew list).",
          "2) Install missing CLIs with non-interactive package managers when possible.",
          "3) For browser OAuth (gog auth, gh auth login): give the user the exact command to run once; then STOP \u2014 do not retry APIs in a loop.",
          '4) Prove setup with a real read command (e.g. gog auth list -j, gog sheets create "Title" -j --no-input, gh auth status).',
          "5) On deleted_client / missing scopes: STOP tools and hand off re-auth one-liners."
        ].join("\n");
      }
      default:
        return `error: unknown tool ${name}`;
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return `error: ${msg.slice(0, 500)}`;
  }
}

// ../daemon/dist/providers/openai-tools.js
var MAX_ROUNDS = 10;
function isMarketingOrWritingTask(user) {
  return /\b(slide|slides|deck|presentation|website|landing\s*page|homepage|campaign|marketing|ad\s*copy|headline|cta|email\s*sequence|nurture|brand\s*voice|video\s*script|reels?|tiktok|copywriting|rewrite|blog\s*post|social\s*post|caption)\b/i.test(user);
}
function wantsShellExecution(user) {
  if (isMarketingOrWritingTask(user))
    return false;
  return /\b(run_shell|run this|in (the )?terminal|exec|shell command|install|brew install|npm i|pnpm |which gog|gog |gh |git status|git diff|kubectl|docker |ssh |curl |load_skill|find_skills|spreadsheet via gog|create sheet)\b/i.test(user);
}
function isAuthOrSetupBlocker(text) {
  return /deleted_client|invalid_client|unauthorized_client|invalid_grant|access.?denied|not.?authenticated|token.*(revoked|expired|invalid)|insufficient.?permission|oauth2?:\s*"|login required|browser OAuth|\[agentpad\] OAuth|\[agentpad\] gog auth|\[agentpad\] Interactive auth|\[agentpad\] gh not|credentials? (missing|invalid|deleted)/i.test(text);
}
function looksLikeCommandDump(text) {
  if (!text)
    return false;
  if (/```(?:bash|sh|zsh|shell)?/i.test(text))
    return true;
  if (/^\s*(brew|npm|pnpm|gog|gh|git|which|curl)\s+/m.test(text))
    return true;
  if (/run this|execute this|paste this|in your terminal/i.test(text))
    return true;
  return false;
}
function toolFingerprint(tc) {
  const name = tc.function?.name ?? "";
  const args = (tc.function?.arguments ?? "").replace(/\s+/g, " ").slice(0, 200);
  return `${name}:${args}`;
}
async function runOpenAiToolsLoop(opts) {
  const mode = opts.toolsMode ?? (wantsShellExecution(opts.user) ? "force" : isMarketingOrWritingTask(opts.user) ? "off" : "auto");
  const toolsOff = mode === "off";
  const forceFirst = mode === "force";
  const systemParts = [opts.system];
  if (toolsOff) {
    systemParts.push("", "# Mode: reply only", "Answer the user directly. Do not invent tool results. No project audit unless asked.");
  } else {
    systemParts.push("", "# Tools policy", "You may use tools when they help THIS request (files, git, shell, skills).", "- For marketing/copy/slides/website text: just write the answer \u2014 no tools.", "- For install/auth/shell work: prefer run_shell over paste-only cookbooks.", "- Never invent stdout. On OAuth blockers: stop and give exact one-liners.");
    if (forceFirst) {
      systemParts.push("- This turn needs execution: use tools first; do not only suggest commands.");
    }
  }
  const system = systemParts.join("\n");
  const user = forceFirst ? [
    opts.user,
    "",
    "[agentpad] Use tools now (run_shell / git / load_skill as needed). Do not only suggest commands."
  ].join("\n") : opts.user;
  const messages = [{ role: "system", content: system }];
  for (const h of opts.history ?? []) {
    if (!h.content?.trim())
      continue;
    if (h.role === "user" || h.role === "assistant") {
      messages.push({ role: h.role, content: h.content });
    }
  }
  messages.push({ role: "user", content: user });
  if (toolsOff) {
    await plainChat(opts, messages, []);
    return;
  }
  let forcedOnce = false;
  let forceFinalAnswer = false;
  const seenCalls = /* @__PURE__ */ new Map();
  const toolLog = [];
  for (let round = 0; round < MAX_ROUNDS; round++) {
    if (opts.signal?.aborted) {
      opts.onEvent({ state: "idle", detail: "cancelled" });
      return;
    }
    const forceTools = forceFirst && round === 0 && !forcedOnce && !forceFinalAnswer;
    opts.onEvent({
      state: "thinking",
      detail: `${opts.label} \xB7 ${opts.model}${round ? ` \xB7 tools\xD7${round}` : ""}${forceTools ? " \xB7 exec" : ""}${forceFinalAnswer ? " \xB7 answer" : ""}`
    });
    const body = {
      model: opts.model,
      messages,
      tools: TOOL_SPECS,
      tool_choice: forceFinalAnswer ? "none" : forceTools ? "required" : "auto",
      temperature: opts.temperature ?? 0.3,
      stream: false
    };
    let res = await fetch(`${opts.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${opts.apiKey}`
      },
      body: JSON.stringify(body),
      signal: opts.signal
    });
    if (!res.ok && forceTools) {
      const errText = await res.text().catch(() => "");
      if (/tool_choice|required|tools/i.test(errText)) {
        forcedOnce = true;
        res = await fetch(`${opts.baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${opts.apiKey}`
          },
          body: JSON.stringify({ ...body, tool_choice: "auto" }),
          signal: opts.signal
        });
      } else {
        opts.onEvent({
          state: "error",
          detail: `HTTP ${res.status}: ${errText.slice(0, 140)}`
        });
        return;
      }
    }
    if (!res.ok && forceFinalAnswer) {
      const errText = await res.text().catch(() => "");
      if (/tool_choice|tools|none/i.test(errText)) {
        await plainChat(opts, messages, toolLog);
        return;
      }
      opts.onEvent({
        state: "error",
        detail: `HTTP ${res.status}: ${errText.slice(0, 140)}`
      });
      return;
    }
    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      if (round === 0 && /tool|function/i.test(errBody)) {
        await plainChat(opts, messages, toolLog);
        return;
      }
      opts.onEvent({
        state: "error",
        detail: `HTTP ${res.status}: ${errBody.slice(0, 140)}`
      });
      return;
    }
    const data = await res.json();
    if (data.error?.message) {
      opts.onEvent({ state: "error", detail: data.error.message.slice(0, 160) });
      return;
    }
    const msg = data.choices?.[0]?.message;
    if (!msg) {
      opts.onEvent({ state: "error", detail: "empty model response" });
      return;
    }
    const toolCalls = msg.tool_calls;
    if (toolCalls?.length && !forceFinalAnswer) {
      forcedOnce = true;
      messages.push({
        role: "assistant",
        content: msg.content ?? null,
        tool_calls: toolCalls
      });
      let sawAuthBlocker = false;
      let thrashing = false;
      for (const tc of toolCalls) {
        const name = tc.function?.name ?? "unknown";
        const argStr = tc.function?.arguments ?? "{}";
        const fp = toolFingerprint(tc);
        const hits = (seenCalls.get(fp) ?? 0) + 1;
        seenCalls.set(fp, hits);
        if (hits >= 3)
          thrashing = true;
        opts.onEvent({ state: "thinking", detail: `\u25B6 ${name}` });
        let result;
        try {
          result = await runTool(name, argStr);
        } catch (e) {
          result = `error: ${e instanceof Error ? e.message : String(e)}`;
        }
        if (isAuthOrSetupBlocker(result))
          sawAuthBlocker = true;
        const preview = result.replace(/\s+/g, " ").slice(0, 80);
        opts.onEvent({
          state: "thinking",
          detail: `\u25B6 ${name} \xB7 ${preview}${result.length > 80 ? "\u2026" : ""}`
        });
        toolLog.push(`${name}(${argStr.slice(0, 80)}): ${result.replace(/\s+/g, " ").slice(0, 200)}`);
        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          name,
          content: result
        });
      }
      if (sawAuthBlocker || thrashing) {
        forceFinalAnswer = true;
        messages.push({
          role: "user",
          content: sawAuthBlocker ? [
            "[agentpad] Auth/setup is blocked (OAuth client deleted, missing scopes, or login required).",
            "STOP calling tools. Reply to the user with:",
            "1) What failed (one line, quote the error).",
            "2) Exact one-liner(s) they must run in their own terminal (browser OAuth).",
            "3) What you will do after they say auth is done.",
            "Do not invent success. Do not retry the same API call."
          ].join("\n") : [
            "[agentpad] You repeated the same tool calls without progress.",
            "STOP tools. Summarize what you tried, the last error, and the single next step for the user."
          ].join("\n")
        });
      }
      continue;
    }
    if (toolCalls?.length && forceFinalAnswer) {
      messages.push({
        role: "assistant",
        content: msg.content || "Auth blocked further tools \u2014 summarizing for the user."
      });
      await plainChat(opts, messages, toolLog);
      return;
    }
    const text = (msg.content ?? "").trim() || msg.reasoning_content?.trim() || "";
    if (forceFirst && !forcedOnce && !forceFinalAnswer && round < 2 && looksLikeCommandDump(text)) {
      forcedOnce = true;
      messages.push({ role: "assistant", content: text });
      messages.push({
        role: "user",
        content: "Stop suggesting. Call run_shell (or other tools) yourself now and execute. Only if a step needs a browser OAuth, stop and give me the exact one-liner."
      });
      continue;
    }
    if (!text && toolLog.length) {
      const summary = synthesizeFromTools(toolLog);
      opts.onEvent({
        state: "done",
        detail: summary.slice(0, 64) + (summary.length > 64 ? "\u2026" : ""),
        text: summary
      });
      return;
    }
    opts.onEvent({
      state: "done",
      detail: (text || "(no content)").slice(0, 64) + (text.length > 64 ? "\u2026" : ""),
      text: text || "(no content)"
    });
    return;
  }
  if (toolLog.length) {
    const summary = [
      "Stopped after too many tool rounds. Last actions:",
      ...toolLog.slice(-6).map((l) => `- ${l}`),
      "",
      "If this was Google Sheets: check `gog auth list -j`. On deleted_client, re-register OAuth credentials then:",
      "`gog auth add you@email.com --services gmail,drive,sheets,docs`"
    ].join("\n");
    opts.onEvent({
      state: "done",
      detail: "tool limit \xB7 see chat",
      text: summary
    });
    return;
  }
  opts.onEvent({
    state: "error",
    detail: `tool loop exceeded ${MAX_ROUNDS} rounds`
  });
}
function synthesizeFromTools(toolLog) {
  const joined = toolLog.join("\n");
  if (isAuthOrSetupBlocker(joined)) {
    return [
      "Blocked on Google OAuth \u2014 cannot create the sheet until auth is fixed.",
      "",
      "Last tool output:",
      ...toolLog.slice(-3).map((l) => `- ${l}`),
      "",
      "Run in your terminal (browser step):",
      "```bash",
      "gog auth credentials /path/to/client_secret.json   # if deleted_client",
      "gog auth add you@gmail.com --services gmail,drive,sheets,docs --force-consent",
      "gog auth list -j",
      "```",
      "Then ask me again to create the sheet."
    ].join("\n");
  }
  return [
    "Tools ran but the model returned no final text. Results:",
    ...toolLog.slice(-6).map((l) => `- ${l}`)
  ].join("\n");
}
async function plainChat(opts, messages, toolLog = []) {
  opts.onEvent({
    state: "thinking",
    detail: `${opts.label} \xB7 ${opts.model} (answer)`
  });
  const res = await fetch(`${opts.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.apiKey}`
    },
    body: JSON.stringify({
      model: opts.model,
      messages: messages.filter((m) => m.role !== "tool" && !m.tool_calls).map((m) => ({
        role: m.role === "tool" ? "user" : m.role,
        content: m.role === "assistant" && !m.content ? "(used tools)" : m.content ?? ""
      })).concat(toolLog.length ? [
        {
          role: "user",
          content: [
            "Tool results from this session (ground truth):",
            ...toolLog.slice(-8).map((l) => `- ${l}`),
            "",
            "Write the final reply to the user now. If auth is broken, give exact fix commands only."
          ].join("\n")
        }
      ] : []),
      temperature: opts.temperature ?? 0.4,
      stream: false
    }),
    signal: opts.signal
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (toolLog.length) {
      const summary = synthesizeFromTools(toolLog);
      opts.onEvent({
        state: "done",
        detail: summary.slice(0, 64) + (summary.length > 64 ? "\u2026" : ""),
        text: summary
      });
      return;
    }
    opts.onEvent({
      state: "error",
      detail: `HTTP ${res.status}: ${body.slice(0, 140)}`
    });
    return;
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content?.trim() || (toolLog.length ? synthesizeFromTools(toolLog) : "(no content)");
  opts.onEvent({
    state: "done",
    detail: text.slice(0, 64) + (text.length > 64 ? "\u2026" : ""),
    text
  });
}

// ../daemon/dist/providers/grok.js
var XAI_BASE = "https://api.x.ai/v1";
function createGrokProvider(getKey) {
  return {
    id: "grok",
    name: "Grok (xAI)",
    mapEffort(level) {
      const models = {
        low: "grok-3-mini",
        medium: "grok-3",
        high: "grok-3",
        max: "grok-3"
      };
      return { model: models[level] ?? "grok-3-mini" };
    },
    async run(input, onEvent) {
      const apiKey = getKey(input.slot);
      if (!apiKey) {
        onEvent({
          state: "error",
          detail: "XAI_API_KEY not set \u2014 open Settings (global or this agent)"
        });
        return;
      }
      const mapped = this.mapEffort?.(input.effort) ?? {};
      const model = mapped.model ?? "grok-3-mini";
      try {
        await runOpenAiToolsLoop({
          baseUrl: XAI_BASE,
          apiKey,
          model,
          system: input.system || "You are MegaPad. Answer clearly. Use tools only when needed.",
          user: input.prompt,
          temperature: input.effort === "low" ? 0.2 : 0.35,
          signal: input.signal,
          onEvent,
          label: "grok",
          history: input.history,
          toolsMode: input.toolsMode
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("abort")) {
          onEvent({ state: "idle", detail: "cancelled" });
          return;
        }
        onEvent({ state: "error", detail: msg.slice(0, 120) });
      }
    }
  };
}

// ../daemon/dist/providers/gemini.js
var BASE = "https://generativelanguage.googleapis.com/v1beta";
function createGeminiProvider(getKey) {
  return {
    id: "gemini",
    name: "Gemini (Google)",
    mapEffort(level) {
      const models = {
        low: "gemini-2.5-flash-lite",
        medium: "gemini-2.5-flash",
        high: "gemini-2.5-flash",
        max: "gemini-2.5-pro"
      };
      return { model: models[level] ?? "gemini-2.5-flash" };
    },
    async run(input, onEvent) {
      const apiKey = getKey(input.slot);
      if (!apiKey) {
        onEvent({
          state: "error",
          detail: "GEMINI_API_KEY not set \u2014 press k, paste key, Enter (not into chat)"
        });
        return;
      }
      if (!looksLikeGeminiKey(apiKey)) {
        onEvent({
          state: "error",
          detail: "Key format looks unusual \u2014 use an API key from https://aistudio.google.com/apikey (often starts with AIza\u2026)"
        });
      }
      const mapped = this.mapEffort?.(input.effort) ?? {};
      const preferred = mapped.model ?? "gemini-2.5-flash";
      const candidates = [
        preferred,
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite",
        "gemini-flash-latest",
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
        "gemini-2.5-pro"
      ].filter((m, i, a) => a.indexOf(m) === i);
      onEvent({ state: "thinking", detail: `gemini \xB7 ${preferred}` });
      const failures = [];
      try {
        for (const model of candidates) {
          if (input.signal?.aborted) {
            onEvent({ state: "idle", detail: "cancelled" });
            return;
          }
          onEvent({ state: "thinking", detail: `gemini \xB7 ${model}` });
          const result = await callGemini(apiKey, model, input.prompt, input.effort, input.signal, input.system);
          if (result.ok) {
            onEvent({
              state: "done",
              detail: result.text.slice(0, 64) + (result.text.length > 64 ? "\u2026" : ""),
              text: result.text
            });
            return;
          }
          failures.push(`${model}: ${result.status} ${result.short}`);
          if (result.status === 429 || result.status === 404 || /quota|rate.?limit|not found|not supported|RESOURCE_EXHAUSTED/i.test(result.message)) {
            continue;
          }
          if (result.status === 400 || result.status === 401 || result.status === 403 || /API_KEY_INVALID|PERMISSION_DENIED|invalid api key/i.test(result.message)) {
            onEvent({
              state: "error",
              detail: summarizeGeminiError(result.message, failures)
            });
            return;
          }
        }
        onEvent({
          state: "error",
          detail: summarizeGeminiError(failures[failures.length - 1] ?? "All Gemini models failed", failures)
        });
      } catch (err) {
        const m = err instanceof Error ? err.message : String(err);
        if (m.toLowerCase().includes("abort")) {
          onEvent({ state: "idle", detail: "cancelled" });
          return;
        }
        onEvent({ state: "error", detail: m.slice(0, 160) });
      }
    }
  };
}
async function callGemini(apiKey, model, prompt, effort, signal, system) {
  const url = `${BASE}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [
          {
            text: system || "You are an AgentPad coding agent. No fluff. Do the work."
          }
        ]
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: effort === "low" ? 0.3 : 0.7
      }
    }),
    signal
  });
  const bodyText = await res.text().catch(() => "");
  let data = {};
  try {
    data = JSON.parse(bodyText);
  } catch {
    data = {};
  }
  if (!res.ok || data.error) {
    const message = data.error?.message || bodyText.slice(0, 300) || `HTTP ${res.status}`;
    return {
      ok: false,
      status: res.status,
      message,
      short: (data.error?.status || message).slice(0, 80)
    };
  }
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim() || "(no content)";
  return { ok: true, text };
}
function looksLikeGeminiKey(key) {
  return /^(AIza|AQ\.)/.test(key.trim());
}
function summarizeGeminiError(raw, failures = []) {
  const tried = failures.map((f) => f.split(":")[0]).filter(Boolean).join(", ");
  if (/limit:\s*0/i.test(raw) && /free_tier/i.test(raw)) {
    return `Gemini free-tier for that model is 0 (not necessarily your whole account). Tried: ${tried || "models"}. Open https://aistudio.google.com/ \u2192 pick a model with quota, or enable billing. AgentPad now prefers gemini-2.5-flash.`.slice(0, 280);
  }
  if (/quota|rate.?limit|RESOURCE_EXHAUSTED/i.test(raw)) {
    return (`Gemini rate/quota on some models (Google 429). Tried: ${tried || "?"}. Check https://ai.dev/rate-limit \u2014 free tier is per-model. Wait or enable billing. ` + raw.replace(/\s+/g, " ").slice(0, 100)).slice(0, 280);
  }
  if (/API_KEY_INVALID|invalid api key/i.test(raw)) {
    return "Invalid GEMINI_API_KEY \u2014 press k, paste a key from https://aistudio.google.com/apikey (do not paste the key into chat)";
  }
  if (/PERMISSION_DENIED/i.test(raw)) {
    return "Gemini PERMISSION_DENIED \u2014 enable Generative Language API for this key\u2019s Google Cloud project";
  }
  return (raw || "Gemini request failed").replace(/\s+/g, " ").slice(0, 220);
}

// ../daemon/dist/providers/claude.js
var BASE2 = "https://api.anthropic.com/v1/messages";
function createClaudeProvider(getKey) {
  return {
    id: "claude",
    name: "Claude (Anthropic)",
    mapEffort(level) {
      const models = {
        low: "claude-3-5-haiku-latest",
        medium: "claude-sonnet-4-20250514",
        high: "claude-sonnet-4-20250514",
        max: "claude-opus-4-20250514"
      };
      return { model: models[level] ?? "claude-sonnet-4-20250514" };
    },
    async run(input, onEvent) {
      const apiKey = getKey(input.slot);
      if (!apiKey) {
        onEvent({
          state: "error",
          detail: "ANTHROPIC_API_KEY not set \u2014 open Settings (global or this agent)"
        });
        return;
      }
      const mapped = this.mapEffort?.(input.effort) ?? {};
      const model = mapped.model ?? "claude-sonnet-4-20250514";
      onEvent({ state: "thinking", detail: `claude \xB7 ${model}` });
      try {
        const res = await fetch(BASE2, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model,
            max_tokens: 4096,
            system: input.system || "You are an AgentPad coding agent. No fluff. Do the work.",
            messages: [{ role: "user", content: input.prompt }],
            temperature: input.effort === "low" ? 0.3 : 0.7
          }),
          signal: input.signal
        });
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          onEvent({
            state: "error",
            detail: `HTTP ${res.status}: ${body.slice(0, 100)}`
          });
          return;
        }
        const data = await res.json();
        const text = data.content?.filter((c) => c.type === "text").map((c) => c.text ?? "").join("").trim() || "(no content)";
        onEvent({
          state: "done",
          detail: text.slice(0, 64) + (text.length > 64 ? "\u2026" : ""),
          text
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.toLowerCase().includes("abort")) {
          onEvent({ state: "idle", detail: "cancelled" });
          return;
        }
        onEvent({ state: "error", detail: msg.slice(0, 80) });
      }
    }
  };
}

// ../daemon/dist/providers/deepseek.js
var BASE3 = "https://api.deepseek.com/v1";
function createDeepSeekProvider(getKey) {
  return {
    id: "deepseek",
    name: "DeepSeek",
    mapEffort(level) {
      const models = {
        low: "deepseek-chat",
        medium: "deepseek-chat",
        high: "deepseek-chat",
        max: "deepseek-reasoner"
      };
      return { model: models[level] ?? "deepseek-chat" };
    },
    async run(input, onEvent) {
      const apiKey = getKey(input.slot);
      if (!apiKey) {
        onEvent({
          state: "error",
          detail: "DEEPSEEK_API_KEY not set \u2014 press k, paste key from platform.deepseek.com"
        });
        return;
      }
      const mapped = this.mapEffort?.(input.effort) ?? {};
      const model = mapped.model ?? "deepseek-chat";
      try {
        await runOpenAiToolsLoop({
          baseUrl: BASE3,
          apiKey,
          model,
          system: input.system || "You are MegaPad. Answer clearly. Use tools only when the task needs them.",
          user: input.prompt,
          temperature: input.effort === "low" ? 0.2 : 0.35,
          signal: input.signal,
          onEvent,
          label: "deepseek",
          history: input.history,
          toolsMode: input.toolsMode
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.toLowerCase().includes("abort")) {
          onEvent({ state: "idle", detail: "cancelled" });
          return;
        }
        onEvent({ state: "error", detail: msg.slice(0, 120) });
      }
    }
  };
}

// ../daemon/dist/providers/openai.js
var BASE4 = "https://api.openai.com/v1";
function createOpenAIProvider(getKey) {
  return {
    id: "openai",
    name: "OpenAI",
    mapEffort(level) {
      const models = {
        low: "gpt-4.1-mini",
        medium: "gpt-4.1-mini",
        high: "gpt-4.1",
        max: "gpt-4.1"
      };
      return { model: models[level] ?? "gpt-4.1-mini" };
    },
    async run(input, onEvent) {
      const apiKey = getKey(input.slot);
      if (!apiKey) {
        onEvent({
          state: "error",
          detail: "OPENAI_API_KEY not set \u2014 Settings \u2192 Global defaults, or use MegaPad hosted"
        });
        return;
      }
      const mapped = this.mapEffort?.(input.effort) ?? {};
      const model = mapped.model ?? "gpt-4.1-mini";
      try {
        await runOpenAiToolsLoop({
          baseUrl: BASE4,
          apiKey,
          model,
          system: input.system || "You are MegaPad. Answer clearly. Use tools only when needed.",
          user: input.prompt,
          temperature: input.effort === "low" ? 0.2 : 0.35,
          signal: input.signal,
          onEvent,
          label: "openai",
          history: input.history,
          toolsMode: input.toolsMode
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.toLowerCase().includes("abort")) {
          onEvent({ state: "idle", detail: "cancelled" });
          return;
        }
        onEvent({ state: "error", detail: msg.slice(0, 120) });
      }
    }
  };
}

// ../daemon/dist/cloud-client.js
import { existsSync as existsSync4, mkdirSync as mkdirSync2, readFileSync as readFileSync4, writeFileSync as writeFileSync2, chmodSync } from "node:fs";
import { homedir as homedir2 } from "node:os";
import { dirname as dirname4, join as join4, resolve as resolve4 } from "node:path";
import { fileURLToPath as fileURLToPath3 } from "node:url";
function cloudConfigPath() {
  const here = dirname4(fileURLToPath3(import.meta.url));
  const projectRoot2 = resolve4(here, "../../..");
  const project = join4(projectRoot2, ".agentpad", "cloud.json");
  if (existsSync4(join4(projectRoot2, "package.json")))
    return project;
  return join4(homedir2(), ".agentpad", "cloud.json");
}
function readFile() {
  try {
    const path2 = cloudConfigPath();
    if (!existsSync4(path2))
      return { version: 1 };
    return JSON.parse(readFileSync4(path2, "utf8"));
  } catch {
    return { version: 1 };
  }
}
function getCloudBaseUrl() {
  const env = process.env.MECHAPAD_CLOUD_URL?.trim();
  if (env)
    return env.replace(/\/$/, "");
  const file = readFile();
  if (file.baseUrl?.trim())
    return file.baseUrl.trim().replace(/\/$/, "");
  return "http://127.0.0.1:7600";
}
function getCloudSessionToken() {
  const env = process.env.MECHAPAD_SESSION_TOKEN?.trim();
  if (env)
    return env;
  return readFile().sessionToken?.trim() || void 0;
}
function cloudConfigured() {
  return Boolean(getCloudSessionToken());
}

// ../daemon/dist/providers/mechapad.js
function createMegaPadProvider() {
  return {
    id: "mechapad",
    name: "MegaPad AI",
    mapEffort(level) {
      const models = {
        low: "mechapad-fast",
        medium: "mechapad-fast",
        high: "mechapad-smart",
        max: "mechapad-smart"
      };
      return { model: models[level] ?? "mechapad-fast" };
    },
    async run(input, onEvent) {
      if (!cloudConfigured()) {
        onEvent({
          state: "error",
          detail: "Sign in free under Plans (Google) \u2014 or subscribe from $10/mo"
        });
        return;
      }
      const token = getCloudSessionToken();
      const base = getCloudBaseUrl();
      const mapped = this.mapEffort?.(input.effort) ?? {};
      const model = mapped.model ?? "mechapad-fast";
      try {
        await runOpenAiToolsLoop({
          baseUrl: `${base}/v1`,
          apiKey: token,
          model,
          system: input.system || "You are MegaPad (hosted). Answer clearly. Use tools only when needed.",
          user: input.prompt,
          temperature: input.effort === "low" ? 0.2 : 0.35,
          signal: input.signal,
          onEvent,
          label: "mechapad",
          history: input.history,
          toolsMode: input.toolsMode
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.toLowerCase().includes("abort")) {
          onEvent({ state: "idle", detail: "cancelled" });
          return;
        }
        onEvent({ state: "error", detail: msg.slice(0, 160) });
      }
    }
  };
}

// ../daemon/dist/chatgpt-oauth.js
import { existsSync as existsSync5, mkdirSync as mkdirSync3, readFileSync as readFileSync5, writeFileSync as writeFileSync3, chmodSync as chmodSync2 } from "node:fs";
import { homedir as homedir3 } from "node:os";
import { dirname as dirname5, join as join5, resolve as resolve5 } from "node:path";
import { fileURLToPath as fileURLToPath4 } from "node:url";
var TOKEN_URL = "https://auth.openai.com/oauth/token";
var CHATGPT_WHAM_BASE = "https://chatgpt.com/backend-api/wham";
var CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann";
var REDIRECT_PORT = 1455;
var REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/auth/callback`;
function storePath() {
  const here = dirname5(fileURLToPath4(import.meta.url));
  const projectRoot2 = resolve5(here, "../../..");
  const project = join5(projectRoot2, ".agentpad", "chatgpt-oauth.json");
  if (existsSync5(join5(projectRoot2, "package.json")))
    return project;
  return join5(homedir3(), ".agentpad", "chatgpt-oauth.json");
}
function readStore() {
  try {
    const p = storePath();
    if (!existsSync5(p))
      return { version: 1, tokens: null };
    return JSON.parse(readFileSync5(p, "utf8"));
  } catch {
    return { version: 1, tokens: null };
  }
}
function persistStore(patch) {
  const prev = readStore();
  const p = storePath();
  mkdirSync3(dirname5(p), { recursive: true });
  const payload = {
    version: 1,
    tokens: patch.tokens !== void 0 ? patch.tokens : prev.tokens,
    ignoreCodex: patch.ignoreCodex !== void 0 ? patch.ignoreCodex : prev.ignoreCodex,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  writeFileSync3(p, JSON.stringify(payload, null, 2) + "\n", { mode: 384 });
  try {
    chmodSync2(p, 384);
  } catch {
  }
}
function writeStore(tokens) {
  if (tokens?.accessToken) {
    persistStore({ tokens, ignoreCodex: false });
  } else {
    persistStore({ tokens: null });
  }
}
function decodeJwtPayload(token) {
  try {
    const part = token.split(".")[1];
    if (!part)
      return null;
    const pad = part + "=".repeat((4 - part.length % 4) % 4);
    return JSON.parse(Buffer.from(pad, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}
function extractAccountId(idToken, accessToken) {
  for (const token of [idToken, accessToken]) {
    if (!token)
      continue;
    const payload = decodeJwtPayload(token);
    if (!payload)
      continue;
    if (typeof payload.chatgpt_account_id === "string") {
      return payload.chatgpt_account_id;
    }
    const nested = payload["https://api.openai.com/auth"];
    if (nested && typeof nested.chatgpt_account_id === "string") {
      return nested.chatgpt_account_id;
    }
    const email = payload.email;
    if (typeof email === "string") {
    }
  }
  return void 0;
}
function extractEmail(idToken, accessToken) {
  for (const token of [idToken, accessToken]) {
    if (!token)
      continue;
    const payload = decodeJwtPayload(token);
    if (payload && typeof payload.email === "string")
      return payload.email;
  }
  return void 0;
}
function tokensFromOauthResponse(raw, fallbackAccountId) {
  const accessToken = String(raw.access_token ?? "");
  const refreshToken = String(raw.refresh_token ?? "");
  const idToken = typeof raw.id_token === "string" ? raw.id_token : void 0;
  const expiresIn = Number(raw.expires_in ?? 3600);
  const accountId = extractAccountId(idToken, accessToken) || fallbackAccountId;
  const email = extractEmail(idToken, accessToken);
  return {
    accessToken,
    refreshToken,
    idToken,
    accountId,
    email,
    expiresAt: Date.now() + expiresIn * 1e3
  };
}
async function refreshTokens(tokens) {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: tokens.refreshToken,
    client_id: CLIENT_ID
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString()
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`ChatGPT token refresh failed: ${res.status} ${text.slice(0, 120)}`);
  }
  const raw = JSON.parse(text);
  const next = tokensFromOauthResponse(raw, tokens.accountId);
  if (!next.refreshToken)
    next.refreshToken = tokens.refreshToken;
  if (!next.email)
    next.email = tokens.email;
  writeStore(next);
  return next;
}
async function getValidChatGptTokens() {
  let tokens = readStore().tokens;
  if (!tokens?.accessToken)
    return null;
  const skew = 6e4;
  if (Date.now() > tokens.expiresAt - skew) {
    try {
      tokens = await refreshTokens(tokens);
    } catch {
      return null;
    }
  }
  return tokens;
}

// ../daemon/dist/providers/chatgpt.js
var DEFAULT_MODEL = "gpt-5.5";
function createChatGptProvider() {
  return {
    id: "chatgpt",
    name: "ChatGPT",
    mapEffort(level) {
      const models = {
        low: DEFAULT_MODEL,
        medium: DEFAULT_MODEL,
        high: DEFAULT_MODEL,
        max: DEFAULT_MODEL
      };
      return { model: models[level] ?? DEFAULT_MODEL };
    },
    async run(input, onEvent) {
      const tokens = await getValidChatGptTokens();
      if (!tokens) {
        onEvent({
          state: "error",
          detail: "Connect ChatGPT under Connect \u2014 one click, no API key"
        });
        return;
      }
      const mapped = this.mapEffort?.(input.effort) ?? {};
      const model = mapped.model ?? DEFAULT_MODEL;
      const system = input.system || "You are a helpful MegaPad agent. Be clear and practical.";
      onEvent({ state: "thinking", detail: "ChatGPT\u2026" });
      try {
        const body = {
          model,
          instructions: system,
          input: [
            {
              role: "user",
              content: [{ type: "input_text", text: input.prompt }]
            }
          ],
          store: false,
          stream: true
        };
        const res = await fetch(`${CHATGPT_WHAM_BASE}/responses`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            "Content-Type": "application/json",
            Accept: "text/event-stream",
            "User-Agent": "mechapad/0.1.0",
            ...tokens.accountId ? { "ChatGPT-Account-Id": tokens.accountId } : {}
          },
          body: JSON.stringify(body),
          signal: input.signal
        });
        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          const msg = res.status === 401 ? "ChatGPT session expired \u2014 Connect again" : `ChatGPT error ${res.status}: ${errText.slice(0, 100)}`;
          onEvent({ state: "error", detail: msg });
          return;
        }
        const reader = res.body?.getReader();
        if (!reader) {
          onEvent({ state: "error", detail: "No stream from ChatGPT" });
          return;
        }
        const dec = new TextDecoder();
        let buf = "";
        let full = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done)
            break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: "))
              continue;
            const payload = line.slice(6).trim();
            if (!payload || payload === "[DONE]")
              continue;
            try {
              const ev = JSON.parse(payload);
              if (ev.type === "response.output_text.delta" && ev.delta) {
                full += ev.delta;
                onEvent({
                  state: "thinking",
                  detail: full.slice(-80),
                  text: full
                });
              } else if (ev.type === "response.output_text.done" && ev.text && !full) {
                full = ev.text;
              }
            } catch {
            }
          }
        }
        if (!full.trim()) {
          onEvent({
            state: "error",
            detail: "ChatGPT returned empty response"
          });
          return;
        }
        onEvent({
          state: "done",
          detail: full.slice(0, 120),
          text: full
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.toLowerCase().includes("abort")) {
          onEvent({ state: "idle", detail: "cancelled" });
          return;
        }
        onEvent({ state: "error", detail: msg.slice(0, 140) });
      }
    }
  };
}

// ../daemon/dist/providers/shell.js
import { spawn } from "node:child_process";
function createShellProvider(command = process.env.AGENTPAD_SHELL_CMD ?? "echo") {
  return {
    id: "shell",
    name: "Shell CLI",
    async run(input, onEvent) {
      onEvent({ state: "thinking", detail: command });
      const useStdin = process.env.AGENTPAD_SHELL_STDIN === "1";
      const parts = command.split(/\s+/).filter(Boolean);
      const bin = parts[0] ?? "echo";
      const args = useStdin ? parts.slice(1) : [...parts.slice(1), input.prompt];
      await new Promise((resolve7) => {
        const child = spawn(bin, args, {
          env: { ...process.env, AGENTPAD_EFFORT: input.effort },
          stdio: useStdin ? ["pipe", "pipe", "pipe"] : ["ignore", "pipe", "pipe"]
        });
        if (useStdin && child.stdin) {
          child.stdin.write(input.prompt);
          child.stdin.end();
        }
        let out = "";
        let err = "";
        child.stdout?.on("data", (c) => {
          out += c.toString();
          const line = out.trim().split("\n").pop() ?? "";
          if (line)
            onEvent({ state: "thinking", detail: line.slice(0, 64) });
        });
        child.stderr?.on("data", (c) => {
          err += c.toString();
        });
        const onAbort = () => {
          child.kill("SIGTERM");
        };
        input.signal?.addEventListener("abort", onAbort);
        child.on("close", (code) => {
          input.signal?.removeEventListener("abort", onAbort);
          if (code === 0) {
            const text = out.trim() || "(no output)";
            onEvent({
              state: "done",
              detail: text.slice(0, 64) + (text.length > 64 ? "\u2026" : ""),
              text
            });
          } else {
            onEvent({
              state: "error",
              detail: (err || `exit ${code}`).slice(0, 80)
            });
          }
          resolve7();
        });
        child.on("error", (e) => {
          onEvent({ state: "error", detail: e.message.slice(0, 80) });
          resolve7();
        });
      });
    }
  };
}

// ../daemon/dist/secrets.js
import { existsSync as existsSync6, mkdirSync as mkdirSync4, readFileSync as readFileSync6, writeFileSync as writeFileSync4, chmodSync as chmodSync3 } from "node:fs";
import { homedir as homedir4 } from "node:os";
import { dirname as dirname6, join as join6, resolve as resolve6 } from "node:path";
import { fileURLToPath as fileURLToPath5 } from "node:url";
var SECRET_META = [
  {
    id: "XAI_API_KEY",
    label: "Grok (xAI)",
    providers: ["grok"]
  },
  {
    id: "GEMINI_API_KEY",
    label: "Gemini (Google)",
    providers: ["gemini"],
    envFallback: ["GOOGLE_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY"]
  },
  {
    id: "ANTHROPIC_API_KEY",
    label: "Claude (Anthropic)",
    providers: ["claude"]
  },
  {
    id: "DEEPSEEK_API_KEY",
    label: "DeepSeek",
    providers: ["deepseek"]
  },
  {
    id: "OPENAI_API_KEY",
    label: "OpenAI",
    providers: ["openai"]
  }
];
function secretsPath() {
  const here = dirname6(fileURLToPath5(import.meta.url));
  const projectRoot2 = resolve6(here, "../../..");
  const project = join6(projectRoot2, ".agentpad", "secrets.json");
  const home = join6(homedir4(), ".agentpad", "secrets.json");
  if (existsSync6(join6(projectRoot2, "package.json")))
    return project;
  return home;
}
function mask(key) {
  const t = key.trim();
  if (t.length <= 8)
    return "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022";
  return `${t.slice(0, 4)}\u2026${t.slice(-4)}`;
}
function isMaskPlaceholder(v) {
  const t = v.trim();
  if (!t)
    return true;
  if (/^[•]+$/.test(t))
    return true;
  if (/^saved\s*\(/i.test(t))
    return true;
  if (t === "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022")
    return true;
  return false;
}
var SecretsStore = class {
  file;
  keys = {};
  agents = {};
  constructor(file = secretsPath()) {
    this.file = file;
    this.reload();
  }
  reload() {
    try {
      if (!existsSync6(this.file)) {
        this.keys = {};
        this.agents = {};
        return;
      }
      const raw = JSON.parse(readFileSync6(this.file, "utf8"));
      this.keys = raw.keys ?? {};
      this.agents = raw.agents ?? {};
    } catch {
      this.keys = {};
      this.agents = {};
    }
  }
  persist() {
    const dir = dirname6(this.file);
    mkdirSync4(dir, { recursive: true });
    const agents = {};
    for (const [slot, map] of Object.entries(this.agents)) {
      const cleaned = {};
      for (const [k, v] of Object.entries(map)) {
        if (v?.trim())
          cleaned[k] = v.trim();
      }
      if (Object.keys(cleaned).length)
        agents[slot] = cleaned;
    }
    const payload = {
      version: 2,
      keys: this.keys,
      agents
    };
    writeFileSync4(this.file, JSON.stringify(payload, null, 2) + "\n", {
      mode: 384
    });
    try {
      chmodSync3(this.file, 384);
    } catch {
    }
  }
  /**
   * Resolve key for a provider call.
   * Order: agent override → global file → process.env → env fallbacks.
   */
  get(id, slot) {
    if (slot !== void 0 && slot !== null) {
      const agentVal = this.agents[String(slot)]?.[id]?.trim();
      if (agentVal)
        return agentVal;
    }
    const fromFile = this.keys[id]?.trim();
    if (fromFile)
      return fromFile;
    const fromEnv = process.env[id]?.trim();
    if (fromEnv)
      return fromEnv;
    const meta = SECRET_META.find((m) => m.id === id);
    for (const alt of meta?.envFallback ?? []) {
      const v = process.env[alt]?.trim();
      if (v)
        return v;
    }
    return void 0;
  }
  /** Global key only (no agent override). */
  getGlobal(id) {
    const fromFile = this.keys[id]?.trim();
    if (fromFile)
      return fromFile;
    const fromEnv = process.env[id]?.trim();
    if (fromEnv)
      return fromEnv;
    const meta = SECRET_META.find((m) => m.id === id);
    for (const alt of meta?.envFallback ?? []) {
      const v = process.env[alt]?.trim();
      if (v)
        return v;
    }
    return void 0;
  }
  setGlobal(id, value) {
    if (value === null || !value.trim() || isMaskPlaceholder(value)) {
      if (value === null || value.trim() === "")
        delete this.keys[id];
      else
        return;
    } else {
      this.keys[id] = value.trim();
    }
    this.persist();
  }
  setAgent(slot, id, value) {
    const key = String(slot);
    if (!this.agents[key])
      this.agents[key] = {};
    if (value === null || !value.trim()) {
      delete this.agents[key][id];
      if (Object.keys(this.agents[key]).length === 0)
        delete this.agents[key];
    } else if (isMaskPlaceholder(value)) {
      return;
    } else {
      this.agents[key][id] = value.trim();
    }
    this.persist();
  }
  /** Apply global key updates. Empty string clears. */
  updateGlobal(patch) {
    for (const [k, v] of Object.entries(patch)) {
      if (v === void 0)
        continue;
      if (isMaskPlaceholder(v) && v.trim() !== "")
        continue;
      this.setGlobal(k, v.trim() === "" ? null : v);
    }
  }
  /** Apply per-agent updates: { "0": { GEMINI_API_KEY: "..." } } */
  updateAgents(patch) {
    for (const [slotStr, map] of Object.entries(patch)) {
      const slot = Number(slotStr);
      if (!Number.isFinite(slot))
        continue;
      for (const [id, v] of Object.entries(map)) {
        if (v === void 0)
          continue;
        if (typeof v === "string" && isMaskPlaceholder(v) && v.trim() !== "") {
          continue;
        }
        this.setAgent(slot, id, v === null || v === "" ? null : v);
      }
    }
  }
  statusGlobal() {
    return SECRET_META.map((m) => {
      const val = this.getGlobal(m.id);
      const fromFile = Boolean(this.keys[m.id]?.trim());
      const fromEnv = !fromFile && Boolean(val);
      return {
        id: m.id,
        label: m.label,
        providers: m.providers,
        set: Boolean(val),
        source: val ? fromFile ? "file" : fromEnv ? "env" : "none" : "none",
        hint: val ? mask(val) : null,
        scope: "global"
      };
    });
  }
  statusAgent(slot) {
    const map = this.agents[String(slot)] ?? {};
    return SECRET_META.map((m) => {
      const override = map[m.id]?.trim();
      const effective = this.get(m.id, slot);
      const global = this.getGlobal(m.id);
      return {
        id: m.id,
        label: m.label,
        providers: m.providers,
        set: Boolean(effective),
        hasOverride: Boolean(override),
        source: override ? "agent" : global ? this.keys[m.id] ? "global" : "env" : "none",
        hint: effective ? mask(effective) : null,
        scope: "agent",
        slot
      };
    });
  }
  /** Snapshot of all agent overrides (masked). */
  statusAllAgents(slotCount = 6) {
    return Array.from({ length: slotCount }, (_, slot) => ({
      slot,
      keys: this.statusAgent(slot)
    }));
  }
  path() {
    return this.file;
  }
};
var singleton = null;
function getSecrets() {
  if (!singleton)
    singleton = new SecretsStore();
  return singleton;
}

// ../daemon/dist/providers/index.js
function createProviders() {
  const key = (id) => (slot) => getSecrets().get(id, slot);
  const map = /* @__PURE__ */ new Map();
  map.set("mock", mockProvider);
  map.set("mechapad", createMegaPadProvider());
  map.set("chatgpt", createChatGptProvider());
  map.set("openai", createOpenAIProvider(key("OPENAI_API_KEY")));
  map.set("grok", createGrokProvider(key("XAI_API_KEY")));
  map.set("gemini", createGeminiProvider(key("GEMINI_API_KEY")));
  map.set("claude", createClaudeProvider(key("ANTHROPIC_API_KEY")));
  map.set("deepseek", createDeepSeekProvider(key("DEEPSEEK_API_KEY")));
  map.set("shell", createShellProvider());
  return map;
}

// src/engine.ts
var PROVIDER_PRICING = {
  claude: {
    name: "Claude Fable 5 / Sonnet 5",
    inputPer1M: 3,
    outputPer1M: 15
  },
  openai: {
    name: "OpenAI GPT-5.5 / Astra",
    inputPer1M: 2.5,
    outputPer1M: 10
  },
  chatgpt: {
    name: "ChatGPT Plus/Pro (Subscription)",
    inputPer1M: 0,
    outputPer1M: 0,
    isSubscriptionOrFree: true
  },
  deepseek: {
    name: "DeepSeek R1 / V3",
    inputPer1M: 0.14,
    outputPer1M: 0.28
  },
  gemini: {
    name: "Gemini 3.8 Pro / Flash",
    inputPer1M: 0.075,
    outputPer1M: 0.3,
    isSubscriptionOrFree: true
    // Free tier quota
  },
  grok: {
    name: "Grok (xAI)",
    inputPer1M: 2,
    outputPer1M: 10
  },
  mock: {
    name: "Mock Engine",
    inputPer1M: 0,
    outputPer1M: 0,
    isSubscriptionOrFree: true
  }
};
var MultiModelEngine = class {
  providers;
  constructor() {
    this.providers = createProviders();
  }
  getAvailableModels() {
    return Array.from(this.providers.values()).map((p) => ({
      id: p.id,
      name: p.name
    }));
  }
  calculateTokens(prompt, output, providerId) {
    const inputTokens = Math.max(1, Math.ceil(prompt.length / 3.8));
    const outputTokens = output ? Math.ceil(output.length / 3.8) : 0;
    const totalTokens = inputTokens + outputTokens;
    const pricing = PROVIDER_PRICING[providerId] ?? {
      name: providerId,
      inputPer1M: 1,
      outputPer1M: 3
    };
    const costUsd = inputTokens / 1e6 * pricing.inputPer1M + outputTokens / 1e6 * pricing.outputPer1M;
    const claudeCost = inputTokens / 1e6 * PROVIDER_PRICING.claude.inputPer1M + outputTokens / 1e6 * PROVIDER_PRICING.claude.outputPer1M;
    let savingsPercent = 0;
    if (claudeCost > 0) {
      savingsPercent = Math.max(0, Math.round((claudeCost - costUsd) / claudeCost * 100));
    }
    return {
      inputTokens,
      outputTokens,
      totalTokens,
      estimatedCostUsd: Number(costUsd.toFixed(6)),
      costSavingsPercentVsClaude: savingsPercent
    };
  }
  async runSingleModel(providerId, prompt, system, effort = "medium") {
    const provider = this.providers.get(providerId);
    if (!provider) {
      return {
        model: providerId,
        provider: providerId,
        success: false,
        text: "",
        error: `Provider '${providerId}' not found. Available: ${Array.from(this.providers.keys()).join(", ")}`,
        durationMs: 0,
        metrics: {
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          estimatedCostUsd: 0,
          costSavingsPercentVsClaude: 0
        }
      };
    }
    const start2 = Date.now();
    let accumulatedText = "";
    let errorDetail = "";
    try {
      await provider.run(
        {
          prompt,
          effort,
          system,
          toolsMode: "off"
        },
        (ev) => {
          if (ev.text) {
            accumulatedText = ev.text;
          }
          if (ev.state === "error" && ev.detail) {
            errorDetail = ev.detail;
          }
        }
      );
      const durationMs = Date.now() - start2;
      const metrics = this.calculateTokens(prompt, accumulatedText, providerId);
      if (errorDetail && !accumulatedText) {
        return {
          model: provider.name,
          provider: providerId,
          success: false,
          text: "",
          error: errorDetail,
          durationMs,
          metrics
        };
      }
      return {
        model: provider.name,
        provider: providerId,
        success: true,
        text: accumulatedText.trim(),
        durationMs,
        metrics
      };
    } catch (err) {
      const durationMs = Date.now() - start2;
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        model: provider.name,
        provider: providerId,
        success: false,
        text: "",
        error: errorMsg,
        durationMs,
        metrics: this.calculateTokens(prompt, "", providerId)
      };
    }
  }
  async compare(prompt, modelIds = ["claude", "openai"], system) {
    const startAll = Date.now();
    const promises = modelIds.map((id) => this.runSingleModel(id, prompt, system));
    const settled = await Promise.allSettled(promises);
    const results = settled.map((s, idx) => {
      if (s.status === "fulfilled") {
        return s.value;
      }
      const modelId = modelIds[idx];
      return {
        model: modelId,
        provider: modelId,
        success: false,
        text: "",
        error: s.reason?.message || "Execution failed",
        durationMs: Date.now() - startAll,
        metrics: this.calculateTokens(prompt, "", modelId)
      };
    });
    let summary = `## \u26A1 Multi-Model Parallel Execution & Token Analytics

`;
    summary += `**Prompt:** *${prompt.length > 100 ? prompt.slice(0, 100) + "\u2026" : prompt}*

`;
    summary += `### \u{1F4CA} Token & Cost Efficiency Breakdown

`;
    summary += `| Provider | Status | Latency | In Tokens | Out Tokens | Total Tokens | Est. Cost (USD) | vs Claude Cost |
`;
    summary += `| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
`;
    for (const r of results) {
      const statusIcon = r.success ? "\u2705" : "\u274C";
      const latencyStr = `${r.durationMs.toLocaleString()}ms`;
      const inTok = r.metrics.inputTokens.toLocaleString();
      const outTok = r.metrics.outputTokens.toLocaleString();
      const totTok = r.metrics.totalTokens.toLocaleString();
      const costStr = r.metrics.estimatedCostUsd === 0 ? "**$0.000 (Free/Sub)**" : `$${r.metrics.estimatedCostUsd.toFixed(5)}`;
      const savingsStr = r.provider === "claude" ? "Base (100%)" : r.metrics.costSavingsPercentVsClaude === 100 ? "\u{1F389} **100% Free**" : `\u26A1 **${r.metrics.costSavingsPercentVsClaude}% Cheaper**`;
      summary += `| **${r.model}** | ${statusIcon} | ${latencyStr} | ${inTok} | ${outTok} | ${totTok} | ${costStr} | ${savingsStr} |
`;
    }
    summary += `
---

`;
    summary += `### \u{1F4DD} Model Responses Side-by-Side

`;
    for (const r of results) {
      const statusIcon = r.success ? "\u2705" : "\u274C";
      summary += `#### ${statusIcon} ${r.model} (${r.durationMs}ms \xB7 ~${r.metrics.totalTokens} tokens)

`;
      if (r.success) {
        summary += `${r.text}

`;
      } else {
        summary += `> \u26A0\uFE0F **Error:** ${r.error}

`;
      }
      summary += `---

`;
    }
    return {
      prompt,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      results,
      formattedSummary: summary
    };
  }
  async reviewCode(code, context = "", reviewerModels = ["openai", "deepseek"]) {
    const reviewPrompt = `You are a principal software engineer conducting an expert code review.
Review the following code thoroughly:
- Identify bugs, edge-cases, memory leaks, and race conditions.
- Suggest architectural and performance optimizations.
- Provide a clean, corrected refactoring if necessary.

Context / Requirements:
${context || "General production readiness review"}

Code to review:
\`\`\`
${code}
\`\`\`
`;
    return this.compare(reviewPrompt, reviewerModels, "You are a senior code review specialist.");
  }
};

// src/installer.ts
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
async function runAgentInstaller() {
  console.log("\n\u{1F680} \x1B[1m\x1B[36mMechapad MCP \u2014 Multi-Agent Auto-Configurator\x1B[0m");
  console.log("Configuring Claude Code, Cursor, Codex CLI, and Antigravity...\n");
  const results = [];
  const home = os.homedir();
  try {
    const claudeConfigPath = path.join(home, ".claude.json");
    let claudeConfig = {};
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
      args: ["-y", "mechapad"],
      env: {}
    };
    const isExisting = Boolean(claudeConfig.mcpServers.mechapad);
    claudeConfig.mcpServers.mechapad = mcpDefinition;
    fs.writeFileSync(claudeConfigPath, JSON.stringify(claudeConfig, null, 2));
    const claudeSettingsDir = path.join(home, ".claude");
    const claudeSettingsPath = path.join(claudeSettingsDir, "settings.json");
    if (fs.existsSync(claudeSettingsDir)) {
      let settings = {};
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
        "mcp__mechapad__mechapad_compare",
        "mcp__mechapad__mechapad_consult_peer",
        "mcp__mechapad__mechapad_council_code_review",
        "mcp__mechapad__mechapad_list_models"
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
      notes: "Auto-configured stdio server & permissions."
    });
  } catch (err) {
    results.push({
      target: "Claude Code",
      status: "skipped",
      path: path.join(home, ".claude.json"),
      notes: err.message
    });
  }
  try {
    const cursorDir = path.join(home, ".cursor");
    const cursorMcpPath = path.join(cursorDir, "mcp.json");
    if (fs.existsSync(cursorDir)) {
      let cursorConfig = {};
      if (fs.existsSync(cursorMcpPath)) {
        try {
          cursorConfig = JSON.parse(fs.readFileSync(cursorMcpPath, "utf-8"));
        } catch {
          cursorConfig = {};
        }
      }
      if (!cursorConfig.mcpServers) cursorConfig.mcpServers = {};
      const isExisting = Boolean(cursorConfig.mcpServers.mechapad);
      cursorConfig.mcpServers.mechapad = {
        command: "npx",
        args: ["-y", "mechapad"]
      };
      fs.writeFileSync(cursorMcpPath, JSON.stringify(cursorConfig, null, 2));
      results.push({
        target: "Cursor IDE (Global)",
        status: isExisting ? "updated" : "installed",
        path: cursorMcpPath,
        notes: "Restart Cursor for changes to take effect."
      });
    } else {
      const localCursorDir = path.join(process.cwd(), ".cursor");
      if (fs.existsSync(localCursorDir)) {
        const localMcpPath = path.join(localCursorDir, "mcp.json");
        let localConfig = {};
        if (fs.existsSync(localMcpPath)) {
          try {
            localConfig = JSON.parse(fs.readFileSync(localMcpPath, "utf-8"));
          } catch {
            localConfig = {};
          }
        }
        if (!localConfig.mcpServers) localConfig.mcpServers = {};
        localConfig.mcpServers.mechapad = {
          command: "npx",
          args: ["-y", "mechapad"]
        };
        fs.writeFileSync(localMcpPath, JSON.stringify(localConfig, null, 2));
        results.push({
          target: "Cursor IDE (Workspace)",
          status: "installed",
          path: localMcpPath
        });
      }
    }
  } catch (err) {
    results.push({
      target: "Cursor IDE",
      status: "skipped",
      path: path.join(home, ".cursor/mcp.json"),
      notes: err.message
    });
  }
  try {
    const codexDir = path.join(home, ".codex");
    const codexConfigPath = path.join(codexDir, "config.toml");
    if (fs.existsSync(codexDir)) {
      let content = "";
      if (fs.existsSync(codexConfigPath)) {
        content = fs.readFileSync(codexConfigPath, "utf-8");
      }
      if (!content.includes("[mcp.mechapad]")) {
        const block = `

[mcp.mechapad]
command = "npx"
args = ["-y", "mechapad"]
`;
        fs.appendFileSync(codexConfigPath, block);
        results.push({
          target: "Codex CLI",
          status: "installed",
          path: codexConfigPath
        });
      } else {
        results.push({
          target: "Codex CLI",
          status: "already_configured",
          path: codexConfigPath
        });
      }
    }
  } catch (err) {
    results.push({
      target: "Codex CLI",
      status: "skipped",
      path: path.join(home, ".codex/config.toml"),
      notes: err.message
    });
  }
  console.log("\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510");
  console.log("\u2502 Agent               \u2502 Status           \u2502 Config Location                            \u2502");
  console.log("\u251C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524");
  for (const r of results) {
    const statusText = r.status === "installed" ? "\x1B[32m\u2714 installed\x1B[0m" : r.status === "updated" ? "\x1B[33m\u21BB updated\x1B[0m" : r.status === "already_configured" ? "\x1B[36m\u2714 active\x1B[0m" : "\x1B[90m- skipped\x1B[0m";
    const agentPadded = r.target.padEnd(19);
    const pathTrunc = r.path.length > 42 ? "..." + r.path.slice(-39) : r.path.padEnd(42);
    console.log(`\u2502 ${agentPadded} \u2502 ${statusText.padEnd(25)} \u2502 ${pathTrunc} \u2502`);
  }
  console.log("\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518\n");
  console.log("\u2728 \x1B[32mMechapad MCP is ready!\x1B[0m\n");
  console.log("Try these commands inside Claude Code, Cursor, or Codex CLI:");
  console.log('  \u2022 \x1B[1m"Run Claude and ChatGPT side-by-side to solve this bug"\x1B[0m');
  console.log('  \u2022 \x1B[1m"Ask DeepSeek R1 for a second opinion on this algorithm"\x1B[0m');
  console.log('  \u2022 \x1B[1m"Run a multi-model code review council on this file"\x1B[0m\n');
  return results;
}

// src/cli-compare.ts
async function runScientificCliBenchmark(prompt, modelList) {
  const engine = new MultiModelEngine();
  const available = engine.getAvailableModels();
  let targetModels = modelList && modelList.length > 0 ? modelList : ["mock", "deepseek", "gemini", "claude", "openai"];
  targetModels = targetModels.filter(
    (m) => available.some((a) => a.id === m) || m === "mock"
  );
  if (targetModels.length === 0) {
    targetModels = ["mock"];
  }
  console.log("\n==========================================================================================");
  console.log(" \u{1F52C} \x1B[1m\x1B[36mMECHAPAD SCIENTIFIC MULTI-MODEL BENCHMARK\x1B[0m");
  console.log("==========================================================================================");
  console.log(`\x1B[90mPrompt:\x1B[0m \x1B[1m"${prompt}"\x1B[0m`);
  console.log(`\x1B[90mTarget Providers:\x1B[0m ${targetModels.map((m) => `\x1B[33m${m}\x1B[0m`).join(", ")}`);
  console.log("\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
  console.log("\u23F3 Running parallel execution & streaming telemetry...\n");
  const startAll = performance.now();
  const promises = targetModels.map(async (modelId) => {
    const t0 = performance.now();
    const res = await engine.runSingleModel(modelId, prompt);
    const t1 = performance.now();
    const latencyMs = Math.round(t1 - t0);
    const inTokens = res.metrics.inputTokens;
    const outTokens = res.metrics.outputTokens;
    const totTokens = inTokens + outTokens;
    const durationSec = Math.max(1e-3, latencyMs / 1e3);
    const tokensPerSec = Math.round(outTokens / durationSec);
    return {
      model: res.model,
      provider: modelId,
      success: res.success,
      latencyMs,
      inputTokens: inTokens,
      outputTokens: outTokens,
      totalTokens: totTokens,
      tokensPerSec,
      costUsd: res.metrics.estimatedCostUsd,
      costSavingsPercent: res.metrics.costSavingsPercentVsClaude,
      text: res.text,
      error: res.error
    };
  });
  const benchmarkResults = await Promise.all(promises);
  const totalElapsedMs = Math.round(performance.now() - startAll);
  console.log("\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510");
  console.log("\u2502 Provider / Model         \u2502 Status \u2502 Latency  \u2502 In / Out \u2502 Total    \u2502 Speed     \u2502 Cost (USD)  \u2502 vs Claude Cost   \u2502");
  console.log("\u251C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524");
  for (const b of benchmarkResults) {
    const namePadded = b.model.slice(0, 24).padEnd(24);
    const statusStr = b.success ? "\x1B[32m\u2714 OK\x1B[0m  " : "\x1B[31m\u2716 ERR\x1B[0m ";
    const latencyStr = `${b.latencyMs.toLocaleString()}ms`.padEnd(8);
    const inOutStr = `${b.inputTokens}/${b.outputTokens}`.padEnd(8);
    const totStr = `${b.totalTokens}`.padEnd(8);
    const speedStr = b.success ? `${b.tokensPerSec} tok/s`.padEnd(9) : "-        ";
    const costStr = b.costUsd === 0 ? "\x1B[32m$0.0000\x1B[0m    " : `$${b.costUsd.toFixed(5)}`.padEnd(11);
    const savingsStr = b.provider === "claude" ? "\x1B[90mBase (100%)\x1B[0m     " : b.costSavingsPercent === 100 ? "\x1B[32m\u{1F389} 100% Free\x1B[0m    " : `\x1B[36m\u26A1 ${b.costSavingsPercent}% Cheaper\x1B[0m `;
    console.log(`\u2502 ${namePadded} \u2502 ${statusStr} \u2502 ${latencyStr} \u2502 ${inOutStr} \u2502 ${totStr} \u2502 ${speedStr} \u2502 ${costStr} \u2502 ${savingsStr}\u2502`);
  }
  console.log("\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518");
  console.log(`\x1B[90mTotal Parallel Wall Clock Time:\x1B[0m \x1B[1m${totalElapsedMs}ms\x1B[0m
`);
  console.log("==========================================================================================");
  console.log(" \u{1F4DD} \x1B[1mDETAILED MODEL RESPONSES\x1B[0m");
  console.log("==========================================================================================\n");
  for (const b of benchmarkResults) {
    const statusHeader = b.success ? `\x1B[32m[${b.model}]\x1B[0m \x1B[90m(${b.latencyMs}ms \xB7 ${b.totalTokens} tokens \xB7 ${b.tokensPerSec} tok/s \xB7 $${b.costUsd.toFixed(5)})\x1B[0m` : `\x1B[31m[${b.model}] FAILED\x1B[0m \x1B[90m(${b.latencyMs}ms)\x1B[0m`;
    console.log(`\x1B[1m${statusHeader}\x1B[0m`);
    console.log("\u2500".repeat(80));
    if (b.success) {
      console.log(b.text);
    } else {
      console.log(`\x1B[31mError:\x1B[0m ${b.error}`);
    }
    console.log("\n");
  }
}

// src/index.ts
async function readStdin() {
  if (process.stdin.isTTY) return "";
  return new Promise((resolve7) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => resolve7(data.trim()));
    setTimeout(() => resolve7(data.trim()), 1e3);
  });
}
async function start() {
  const isInstaller = process.argv.includes("install") || process.argv.includes("--install");
  if (isInstaller) {
    await runAgentInstaller();
    process.exit(0);
  }
  const isServeMcp = process.argv.includes("serve") || process.argv.includes("--mcp");
  const isCompareCmd = process.argv.includes("compare") || process.argv.includes("benchmark") || !isServeMcp && process.argv.length > 2 && !process.argv[2].startsWith("-");
  if (isCompareCmd) {
    const rawArgs = process.argv.slice(2);
    let models;
    const modelsIdx = rawArgs.indexOf("--models");
    if (modelsIdx !== -1 && rawArgs[modelsIdx + 1]) {
      models = rawArgs[modelsIdx + 1].split(",").map((s) => s.trim());
      rawArgs.splice(modelsIdx, 2);
    }
    const promptTokens = rawArgs.filter((a) => a !== "compare" && a !== "benchmark");
    let userPrompt = promptTokens.join(" ").trim();
    const pipedStdin = await readStdin();
    if (pipedStdin) {
      userPrompt = userPrompt ? `${userPrompt}

Input Context:
\`\`\`
${pipedStdin}
\`\`\`` : `Analyze and review the following input:
\`\`\`
${pipedStdin}
\`\`\``;
    }
    if (!userPrompt) {
      userPrompt = "Write an optimized LRU cache in TypeScript and analyze time/space complexity.";
    }
    await runScientificCliBenchmark(userPrompt, models);
    process.exit(0);
  }
  startMcpServer();
}
function startMcpServer() {
  const engine = new MultiModelEngine();
  const server = new Server(
    {
      name: "mechapad",
      version: "0.1.0"
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "mechapad_compare",
          description: "Executes a prompt across multiple AI frontier models (Claude, OpenAI / GPT-4o, DeepSeek, Gemini, Grok) in parallel and returns side-by-side responses with performance metrics for comparison.",
          inputSchema: {
            type: "object",
            properties: {
              prompt: {
                type: "string",
                description: "The prompt or coding question to run across multiple models."
              },
              models: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["claude", "openai", "deepseek", "gemini", "grok", "mechapad", "mock"]
                },
                description: "List of model providers to execute concurrently. Defaults to ['claude', 'openai']."
              },
              system: {
                type: "string",
                description: "Optional custom system instructions for all models."
              }
            },
            required: ["prompt"]
          }
        },
        {
          name: "mechapad_consult_peer",
          description: "Asks a specific peer AI model (e.g. DeepSeek R1 for mathematical reasoning or OpenAI GPT-4o for code) a targeted question to get a second opinion.",
          inputSchema: {
            type: "object",
            properties: {
              model: {
                type: "string",
                enum: ["claude", "openai", "deepseek", "gemini", "grok", "mechapad", "mock"],
                description: "The target model provider to query."
              },
              prompt: {
                type: "string",
                description: "The query or instruction to send to the target model."
              },
              system: {
                type: "string",
                description: "Optional custom system instructions."
              }
            },
            required: ["model", "prompt"]
          }
        },
        {
          name: "mechapad_council_code_review",
          description: "Sends code to a council of peer models (e.g. DeepSeek and OpenAI) to find edge-case bugs, security vulnerabilities, and alternative performance optimizations.",
          inputSchema: {
            type: "object",
            properties: {
              code: {
                type: "string",
                description: "The code snippet or implementation to review."
              },
              context: {
                type: "string",
                description: "Optional context, requirements, language version, or edge-case constraints."
              },
              reviewer_models: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["openai", "deepseek", "claude", "gemini", "grok", "mock"]
                },
                description: "Models to include in the review council. Defaults to ['openai', 'deepseek']."
              }
            },
            required: ["code"]
          }
        },
        {
          name: "mechapad_list_models",
          description: "Lists all configured and available model providers in Mechapad.",
          inputSchema: {
            type: "object",
            properties: {}
          }
        }
      ]
    };
  });
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
      if (name === "mechapad_compare") {
        const prompt = String(args?.prompt || "");
        const models = Array.isArray(args?.models) && args.models.length > 0 ? args.models : ["claude", "openai"];
        const system = args?.system ? String(args.system) : void 0;
        const res = await engine.compare(prompt, models, system);
        return {
          content: [
            {
              type: "text",
              text: res.formattedSummary
            }
          ]
        };
      }
      if (name === "mechapad_consult_peer") {
        const model = String(args?.model || "openai");
        const prompt = String(args?.prompt || "");
        const system = args?.system ? String(args.system) : void 0;
        const res = await engine.runSingleModel(model, prompt, system);
        if (res.success) {
          return {
            content: [
              {
                type: "text",
                text: `### [${res.model}] (${res.durationMs}ms \xB7 ~${res.metrics.totalTokens} tokens \xB7 $${res.metrics.estimatedCostUsd.toFixed(5)})

${res.text}`
              }
            ]
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: `\u26A0\uFE0F **Error from ${res.model}:** ${res.error}`
              }
            ],
            isError: true
          };
        }
      }
      if (name === "mechapad_council_code_review") {
        const code = String(args?.code || "");
        const context = args?.context ? String(args.context) : "";
        const reviewers = Array.isArray(args?.reviewer_models) && args.reviewer_models.length > 0 ? args.reviewer_models : ["openai", "deepseek"];
        const res = await engine.reviewCode(code, context, reviewers);
        return {
          content: [
            {
              type: "text",
              text: res.formattedSummary
            }
          ]
        };
      }
      if (name === "mechapad_list_models") {
        const models = engine.getAvailableModels();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(models, null, 2)
            }
          ]
        };
      }
      throw new Error(`Unknown tool: ${name}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        content: [
          {
            type: "text",
            text: `Mechapad MCP Error: ${errorMsg}`
          }
        ],
        isError: true
      };
    }
  });
  const transport = new StdioServerTransport();
  server.connect(transport).then(() => {
    console.error("Mechapad MCP Server running on stdio");
  }).catch((err) => {
    console.error("Fatal error running Mechapad MCP Server:", err);
    process.exit(1);
  });
}
start().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
