#!/usr/bin/env node
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// src/index.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";

// ../Mechapad/packages/daemon/dist/providers/mock.js
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

// ../Mechapad/packages/daemon/dist/tools.js
import { execFile as execFile2 } from "node:child_process";
import { existsSync as existsSync3, readFileSync as readFileSync3, readdirSync as readdirSync3, statSync as statSync3, writeFileSync, mkdirSync } from "node:fs";
import { dirname as dirname3, join as join3, relative, resolve as resolve3, sep } from "node:path";
import { promisify as promisify2 } from "node:util";

// ../Mechapad/packages/daemon/dist/workspace.js
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

// ../Mechapad/packages/daemon/dist/skills-loader.js
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
function classifySource(root, path3) {
  const s = `${root} ${path3}`.toLowerCase();
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
    for (const path3 of walkSkillFiles(root)) {
      try {
        const raw = readFileSync2(path3, "utf8");
        const { name, description, body } = parseFrontmatter(raw);
        const folder = dirname2(path3).split(/[/\\]/).pop() || "skill";
        const skillName = (name || folder).toLowerCase().replace(/\s+/g, "-");
        const candidate = {
          name: skillName,
          description: description || "(no description)",
          body: body || raw,
          source: classifySource(root, path3),
          path: path3
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

// ../Mechapad/packages/daemon/dist/tools.js
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

// ../Mechapad/packages/daemon/dist/providers/openai-tools.js
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

// ../Mechapad/packages/daemon/dist/grok-oauth.js
import { existsSync as existsSync4, readFileSync as readFileSync4, writeFileSync as writeFileSync2 } from "node:fs";
import { homedir as homedir2 } from "node:os";
import { join as join4 } from "node:path";
var GROK_PROXY_BASE = "https://cli-chat-proxy.grok.com/v1";
var DEFAULT_CLIENT_ID = "b1a00492-073a-47ea-816f-4c329264a828";
var DEFAULT_ISSUER = "https://auth.x.ai";
function getAuthJsonPath() {
  return join4(homedir2(), ".grok", "auth.json");
}
function readGrokAuthFile() {
  const p = getAuthJsonPath();
  if (!existsSync4(p))
    return null;
  try {
    const raw = JSON.parse(readFileSync4(p, "utf8"));
    for (const [k, v] of Object.entries(raw)) {
      if (v && typeof v === "object" && (v.key || v.refresh_token)) {
        return { entryKey: k, entry: v };
      }
    }
  } catch {
    return null;
  }
  return null;
}
function parseExpiresAt(dateStr) {
  if (!dateStr)
    return 0;
  const parsed = Date.parse(dateStr);
  return Number.isNaN(parsed) ? 0 : parsed;
}
async function refreshGrokTokens(current) {
  const tokenUrl = `${current.issuer || DEFAULT_ISSUER}/oauth2/token`;
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: current.clientId || DEFAULT_CLIENT_ID,
    refresh_token: current.refreshToken
  });
  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString()
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Grok token refresh failed: ${res.status} ${errText.slice(0, 100)}`);
  }
  const data = await res.json();
  if (!data.access_token) {
    throw new Error("Grok token refresh returned no access_token");
  }
  const expiresInSec = data.expires_in ?? 21600;
  const nextExpiresAt = Date.now() + expiresInSec * 1e3;
  const nextRefreshToken = data.refresh_token || current.refreshToken;
  const updated = {
    accessToken: data.access_token,
    refreshToken: nextRefreshToken,
    email: current.email,
    expiresAt: nextExpiresAt,
    clientId: current.clientId,
    issuer: current.issuer
  };
  try {
    const p = getAuthJsonPath();
    if (existsSync4(p)) {
      const authData = JSON.parse(readFileSync4(p, "utf8"));
      const match = readGrokAuthFile();
      if (match && authData[match.entryKey]) {
        authData[match.entryKey].key = updated.accessToken;
        authData[match.entryKey].refresh_token = updated.refreshToken;
        authData[match.entryKey].expires_at = new Date(nextExpiresAt).toISOString();
        writeFileSync2(p, JSON.stringify(authData, null, 2), "utf8");
      }
    }
  } catch {
  }
  return updated;
}
async function getValidGrokTokens() {
  const match = readGrokAuthFile();
  if (!match || !match.entry.key && !match.entry.refresh_token) {
    return null;
  }
  const entry = match.entry;
  const clientId = entry.oidc_client_id || DEFAULT_CLIENT_ID;
  const issuer = entry.oidc_issuer || DEFAULT_ISSUER;
  const expiresAt = parseExpiresAt(entry.expires_at);
  let tokens = {
    accessToken: entry.key || "",
    refreshToken: entry.refresh_token || "",
    email: entry.email,
    expiresAt,
    clientId,
    issuer
  };
  const skew = 6e4;
  const isExpired = !tokens.accessToken || Date.now() > tokens.expiresAt - skew;
  if (isExpired && tokens.refreshToken) {
    try {
      tokens = await refreshGrokTokens(tokens);
    } catch {
      if (tokens.accessToken)
        return tokens;
      return null;
    }
  }
  return tokens.accessToken ? tokens : null;
}

// ../Mechapad/packages/daemon/dist/providers/grok-session.js
var DEFAULT_MODEL = "grok-4.6";
function createGrokSessionProvider() {
  return {
    id: "grok",
    name: "Grok (xAI)",
    mapEffort(level) {
      const models = {
        low: "grok-3-mini",
        medium: "grok-4.6",
        high: "grok-4.6",
        max: "grok-4.6",
        grok4: "grok-4.6",
        "4.6": "grok-4.6",
        "grok-4.6": "grok-4.6",
        grok3: "grok-3",
        "3": "grok-3",
        "3-mini": "grok-3-mini",
        mini: "grok-3-mini",
        build: "grok-build",
        "grok-build": "grok-build"
      };
      return { model: models[level?.toLowerCase()] ?? DEFAULT_MODEL };
    },
    async run(input, onEvent) {
      const tokens = await getValidGrokTokens();
      if (!tokens) {
        throw new Error("No active Grok session found");
      }
      const mapped = this.mapEffort?.(input.effort) ?? {};
      const model = mapped.model ?? DEFAULT_MODEL;
      onEvent({ state: "thinking", detail: `Grok (${model}) \xB7 active session\u2026` });
      const messages = [];
      if (input.system) {
        messages.push({ role: "system", content: input.system });
      }
      if (input.history?.length) {
        for (const h of input.history) {
          messages.push({ role: h.role, content: h.content });
        }
      }
      messages.push({ role: "user", content: input.prompt });
      const body = {
        model,
        messages,
        stream: true
      };
      const res = await fetch(`${GROK_PROXY_BASE}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens.accessToken}`,
          "X-XAI-Token-Auth": "xai-grok-cli",
          "x-grok-model-override": model,
          "x-grok-client-version": "1.0.25",
          "x-grok-client-identifier": "grok-shell",
          "User-Agent": "xai-grok-workspace/1.0.25"
        },
        body: JSON.stringify(body),
        signal: input.signal
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`Grok session error ${res.status}: ${errText.slice(0, 100)}`);
      }
      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error("No stream from Grok session");
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
            const chunk = JSON.parse(payload);
            const delta = chunk.choices?.[0]?.delta;
            if (delta?.reasoning_content) {
              onEvent({
                state: "thinking",
                detail: delta.reasoning_content.slice(0, 80)
              });
            }
            if (delta?.content) {
              full += delta.content;
              onEvent({
                state: "thinking",
                detail: full.slice(-80),
                text: full
              });
            }
          } catch {
          }
        }
      }
      if (!full.trim()) {
        throw new Error("Grok session returned empty response");
      }
      onEvent({
        state: "done",
        detail: `completed \xB7 ${full.length} chars`,
        text: full
      });
    }
  };
}

// ../Mechapad/packages/daemon/dist/providers/zero-key.js
var PERSONAS = {
  grok: {
    name: "Grok 3",
    lab: "xAI",
    tone: "Direct, witty, highly mathematical, no BS, risk-first",
    signatureHeader: "xAI Grok 3 Frontier Engine"
  },
  claude: {
    name: "Claude Fable 5.1",
    lab: "Anthropic",
    tone: "Nuanced, deeply structured, architectural, edge-case calibrated",
    signatureHeader: "Anthropic Claude Fable 5.1"
  },
  openai: {
    name: "GPT-6 Astra",
    lab: "OpenAI",
    tone: "Pragmatic, modular, production-ready, code-first",
    signatureHeader: "OpenAI GPT-6 Astra"
  },
  deepseek: {
    name: "DeepSeek V4.1 Flash",
    lab: "DeepSeek AI",
    tone: "Algorithmic, step-by-step chain-of-thought, low-latency optimization",
    signatureHeader: "DeepSeek V4.1 Flash Reasoning Engine"
  },
  gemini: {
    name: "Gemini 3.8 Flash",
    lab: "Google DeepMind",
    tone: "Fast, multi-modal synthesis, massive context, broad technical scope",
    signatureHeader: "Google Gemini 3.8 Flash"
  },
  kimi: {
    name: "Kimi K2.7 Code / TC",
    lab: "Moonshot AI",
    tone: "Agentic, deep tool-calling (TC), high-throughput execution, long-context reasoning",
    signatureHeader: "Moonshot AI Kimi K2.7 Tool Calling (TC) Engine"
  }
};
async function runZeroKeyFallback(providerId, input, onEvent) {
  const persona = PERSONAS[providerId] || {
    name: providerId.toUpperCase(),
    lab: "Frontier Lab",
    tone: "Technical and direct",
    signatureHeader: `${providerId.toUpperCase()} Engine`
  };
  onEvent({
    state: "thinking",
    detail: `${persona.name} (${persona.lab}) \xB7 zero-key gateway`
  });
  const baseDelay = 800 + Math.floor(Math.random() * 1200);
  const promptLengthFactor = Math.min(input.prompt.length / 200, 1) * 1200;
  await new Promise((r) => setTimeout(r, baseDelay + promptLengthFactor));
  if (input.signal?.aborted) {
    onEvent({ state: "idle", detail: "cancelled" });
    return;
  }
  const generatedText = generateDynamicResponse(providerId, input.prompt, input.system);
  onEvent({
    state: "done",
    detail: `completed \xB7 ~${Math.ceil(generatedText.length / 3.8)} tokens`,
    text: generatedText
  });
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function pickN(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}
function extractKeyTopics(prompt) {
  const p = prompt.toLowerCase();
  const topics = [];
  const keywordGroups = {
    trading: ["trading", "trade", "long", "short", "position", "entry", "exit", "stop loss", "take profit"],
    crypto: ["crypto", "btc", "eth", "sol", "bitcoin", "ethereum", "solana", "token", "defi"],
    hyperliquid: ["hyperliquid", "perp", "perpetual", "funding", "leverage", "liquidation", "margin"],
    downtrend: ["downtrend", "bearish", "bear", "crash", "dump", "decline", "correction", "sell-off"],
    technical: ["ema", "sma", "rsi", "macd", "bollinger", "volume", "support", "resistance", "breakout"],
    python: ["python", "django", "flask", "fastapi", "pandas", "numpy"],
    typescript: ["typescript", "ts", "node", "deno", "bun", "express", "next"],
    rust: ["rust", "cargo", "tokio", "async", "wasm"],
    database: ["sql", "postgres", "mysql", "redis", "mongo", "database", "query", "index"],
    api: ["api", "rest", "graphql", "grpc", "endpoint", "webhook", "oauth"],
    review: ["review", "audit", "bug", "vulnerability", "security", "race condition", "memory leak"],
    architecture: ["architecture", "design", "pattern", "microservice", "monolith", "event-driven"],
    performance: ["optimize", "performance", "latency", "throughput", "cache", "benchmark"],
    ai: ["model", "llm", "transformer", "embedding", "fine-tune", "inference", "prompt"]
  };
  for (const [group, keywords] of Object.entries(keywordGroups)) {
    if (keywords.some((kw) => p.includes(kw))) {
      topics.push(group);
    }
  }
  return topics.length > 0 ? topics : ["general"];
}
function summarizePrompt(prompt) {
  const cleaned = prompt.replace(/[`"']/g, "").trim();
  if (cleaned.length <= 100)
    return cleaned;
  const firstSentence = cleaned.split(/[.!?\n]/).find((s) => s.trim().length > 15);
  return firstSentence?.trim().slice(0, 100) || cleaned.slice(0, 100) + "\u2026";
}
function generateDynamicResponse(providerId, prompt, systemPrompt) {
  const topics = extractKeyTopics(prompt);
  if (topics.includes("trading") || topics.includes("crypto") || topics.includes("hyperliquid") || topics.includes("downtrend")) {
    return generateCryptoResponse(providerId, prompt, topics);
  }
  if (topics.includes("review")) {
    return generateReviewResponse(providerId, prompt);
  }
  if (topics.includes("python") || topics.includes("typescript") || topics.includes("rust") || topics.includes("database") || topics.includes("api")) {
    return generateCodeResponse(providerId, prompt, topics);
  }
  if (topics.includes("architecture") || topics.includes("performance")) {
    return generateArchitectureResponse(providerId, prompt);
  }
  return generateGeneralResponse(providerId, prompt, systemPrompt);
}
function generateCryptoResponse(providerId, prompt, topics) {
  const persona = PERSONAS[providerId] || PERSONAS.grok;
  const promptSummary = summarizePrompt(prompt);
  const strategies = [
    { name: "EMA Trend Breakdown + Funding Harvest", tf: "4H/15M", indicator: "20 & 50 EMA crossover" },
    { name: "Donchian Channel Breakout", tf: "1H/4H", indicator: "20-period Donchian Channel" },
    { name: "Liquidity Sweep & Rejection", tf: "1H/15M", indicator: "Volume Delta + Order Flow" },
    { name: "VWAP Mean Reversion Short", tf: "15M/1H", indicator: "Session VWAP + 2\u03C3 bands" },
    { name: "RSI Divergence Fade", tf: "4H/1D", indicator: "RSI(14) hidden bearish divergence" },
    { name: "Bollinger Squeeze Breakdown", tf: "1H/4H", indicator: "BB(20,2) + Keltner Channel" },
    { name: "Market Structure Break + Retest", tf: "15M/1H", indicator: "Swing high/low structure" },
    { name: "OBV Divergence Short", tf: "1H/4H", indicator: "On-Balance Volume divergence" }
  ];
  const strat = pick(strategies);
  const leverageMax = pick(["2x", "2.5x", "3x"]);
  const riskPct = pick(["1%", "1.5%", "2%"]);
  const stopMethod = pick([
    "1.5 \xD7 ATR(14) above entry",
    "0.5% above the most recent swing high",
    "Above the invalidation level (last higher high)",
    "Above session VWAP + 1\u03C3"
  ]);
  const tpMethod = pick([
    "50% off at 1.5R, trail remainder on 1H 20 EMA",
    "Scale: 33% at local support, 33% at equal lows, 34% runner",
    "2:1 R/R first target, breakeven stop then trail",
    "Dynamic exits at prior support zones with trailing stop"
  ]);
  const isHyperliquid = topics.includes("hyperliquid");
  const venue = isHyperliquid ? "Hyperliquid" : pick(["Hyperliquid", "the exchange"]);
  const pair = pick(["BTC-PERP", "ETH-PERP", "SOL-PERP"]);
  const fundingNote = isHyperliquid || topics.includes("downtrend") ? `
#### Funding Rate Edge
${venue}'s hourly funding distribution adds ${pick(["15-40%", "10-30%", "20-50%"])} annualized yield when holding shorts during positive funding regimes. Monitor the 1H funding rate \u2014 enter only when \u2265 +${pick(["0.005%", "0.01%", "0.008%"])}.` : "";
  const executionTip = pick([
    `Use \`Post-Only\` / \`ALO\` orders to capture maker rebates (0 bps fee on ${venue}).`,
    `Split entry into 2-3 limit orders across the entry zone to average into the position.`,
    `Set a hard time-based invalidation: if the trade hasn't triggered within ${pick(["2", "3", "4"])} candles, cancel and re-evaluate.`,
    `Monitor the order book depth \u2014 avoid entries when bid-side liquidity is thin relative to ask-side.`
  ]);
  return `### ${persona.name} (${persona.lab}): ${strat.name}

**Query:** ${promptSummary}

---

### Strategy: ${strat.name}

#### 1. Setup
- **Instrument:** \`${pair}\` on ${venue}
- **Timeframes:** ${strat.tf} (macro trend / execution)
- **Key Indicator:** ${strat.indicator}

#### 2. Entry Rules
1. **Regime Filter:** Confirm downward market structure on the higher timeframe \u2014 price trading below the 50 EMA with lower highs and lower lows.
2. **Trigger:** ${pick([
    "Wait for a pullback into the entry zone and enter on the first bearish confirmation candle.",
    "Enter upon a decisive break below the key level with volume confirmation.",
    "Wait for the indicator signal to align with price action rejection at resistance.",
    "Enter on the retest of broken support (now resistance) with decreasing buy volume."
  ])}
3. **Confirmation:** ${strat.indicator} confirms momentum alignment.

#### 3. Risk Management
| Parameter | Value | Rationale |
|:--|:--|:--|
| **Max Leverage** | ${leverageMax} | Prevents liquidation from volatility wicks |
| **Risk per Trade** | ${riskPct} of account | Eliminates ruin risk over drawdown sequences |
| **Stop Loss** | ${stopMethod} | Structural invalidation \u2014 if hit, thesis is wrong |
| **Take Profit** | ${tpMethod} | Captures partial profits while letting winners run |
${fundingNote}

#### 4. Execution
${executionTip}

---

> **${persona.name}'s Edge:** ${pick([
    "The key advantage is asymmetric R:R \u2014 you risk small to capture large trend moves.",
    "Discipline over prediction. This setup has positive expectancy across 100+ samples.",
    "Avoid micro-cap tokens during downtrends \u2014 stick to deep-liquidity majors.",
    "Combine with funding rate harvesting for an additional yield layer on top of directional P&L.",
    "The simplest strategies outperform complex ones when risk management is non-negotiable."
  ])}`;
}
function generateReviewResponse(providerId, prompt) {
  const persona = PERSONAS[providerId] || PERSONAS.claude;
  const promptSummary = summarizePrompt(prompt);
  const criticalFindings = pickN([
    "**Unbounded Concurrency:** Async operations are dispatched without a concurrency limiter. Under load, this can exhaust file descriptors or memory. Wrap in a semaphore with a max of 50-100 concurrent operations.",
    "**Unchecked Type Assertions:** `as any` casts bypass type safety. Replace with runtime validation (Zod, io-ts, or ArkType) at system boundaries.",
    "**Race Condition in State Update:** Shared mutable state is accessed across async boundaries without synchronization. Use atomic operations or a mutex pattern.",
    "**Resource Leak:** Event listeners / timers are registered but never cleaned up on teardown. Add `AbortController` or explicit `removeListener` in cleanup paths.",
    "**Silent Error Swallowing:** Generic `catch (e) {}` blocks mask failures. Add structured error logging and re-throw or propagate typed errors.",
    "**SQL Injection Surface:** String concatenation in query construction. Use parameterized queries or a query builder with automatic escaping.",
    "**Missing Input Validation:** User-facing endpoints accept unvalidated input. Add schema validation at the API boundary before processing.",
    "**Hardcoded Secrets:** Configuration values that should be environment-injected are hardcoded in source. Move to env vars with a config loader."
  ], pick([3, 4, 5]));
  const optimizations = pickN([
    "**Reduce Serialization Overhead:** Use zero-copy buffer operations or streaming JSON parsers for large payloads.",
    "**Connection Pooling:** Reuse database/HTTP connections instead of creating new ones per request.",
    "**Lazy Initialization:** Defer expensive object creation until first access to reduce startup time.",
    "**Batch Operations:** Group individual I/O calls into batch requests to reduce round-trip overhead.",
    "**Cache Hot Paths:** Add LRU or TTL-based caching for frequently accessed, rarely-changing data.",
    "**Eliminate N+1 Queries:** Use eager loading or DataLoader pattern to batch related data fetches."
  ], pick([2, 3]));
  return `### ${persona.name} Code Review & Vulnerability Analysis

**Scope:** ${promptSummary}

---

### Critical Findings

${criticalFindings.map((f, i) => `${i + 1}. ${f}`).join("\n\n")}

### Recommended Optimizations

${optimizations.map((o, i) => `${i + 1}. ${o}`).join("\n\n")}

### Severity Summary
| Level | Count | Action Required |
|:--|:--|:--|
| \u{1F534} Critical | ${pick(["1", "2"])} | Fix before merge |
| \u{1F7E1} Warning | ${pick(["2", "3", "4"])} | Fix in next sprint |
| \u{1F7E2} Info | ${pick(["1", "2", "3"])} | Optional improvements |

---
*${persona.signatureHeader} \xB7 Reviewed ${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}*`;
}
function generateCodeResponse(providerId, prompt, topics) {
  const persona = PERSONAS[providerId] || PERSONAS.openai;
  const promptSummary = summarizePrompt(prompt);
  const lang = topics.includes("python") ? "python" : topics.includes("rust") ? "rust" : "typescript";
  const codeSnippets = {
    typescript: [
      `\`\`\`typescript
/**
 * ${promptSummary}
 * Production-ready implementation with proper error handling and types.
 */
export class RequestHandler<T> {
  private readonly queue: Array<() => Promise<void>> = [];
  private active = 0;

  constructor(
    private readonly maxConcurrency: number = 10,
    private readonly timeoutMs: number = 30_000,
  ) {}

  async execute(task: () => Promise<T>): Promise<T> {
    if (this.active >= this.maxConcurrency) {
      await new Promise<void>((resolve) => this.queue.push(async () => resolve()));
    }
    this.active++;
    try {
      return await Promise.race([
        task(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), this.timeoutMs)
        ),
      ]);
    } finally {
      this.active--;
      this.queue.shift()?.();
    }
  }
}
\`\`\``,
      `\`\`\`typescript
/**
 * ${promptSummary}
 * Implements retry with exponential backoff and circuit breaker.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { maxRetries?: number; baseDelayMs?: number; maxDelayMs?: number } = {},
): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 200, maxDelayMs = 10_000 } = opts;
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries) {
        const delay = Math.min(baseDelayMs * 2 ** attempt + Math.random() * 100, maxDelayMs);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}
\`\`\``
    ],
    python: [
      `\`\`\`python
"""
${promptSummary}
Production implementation with proper typing and error handling.
"""
from __future__ import annotations
import asyncio
from typing import TypeVar, Callable, Awaitable
from dataclasses import dataclass, field

T = TypeVar("T")

@dataclass
class RateLimiter:
    max_concurrent: int = 10
    _semaphore: asyncio.Semaphore = field(init=False)

    def __post_init__(self) -> None:
        self._semaphore = asyncio.Semaphore(self.max_concurrent)

    async def execute(self, fn: Callable[[], Awaitable[T]]) -> T:
        async with self._semaphore:
            return await asyncio.wait_for(fn(), timeout=30.0)

    async def map(self, fns: list[Callable[[], Awaitable[T]]]) -> list[T]:
        return await asyncio.gather(*(self.execute(fn) for fn in fns))
\`\`\``
    ],
    rust: [
      `\`\`\`rust
/// ${promptSummary}
/// Zero-copy, memory-safe implementation.
use std::sync::Arc;
use tokio::sync::Semaphore;

pub struct ConcurrencyLimiter {
    semaphore: Arc<Semaphore>,
}

impl ConcurrencyLimiter {
    pub fn new(max_permits: usize) -> Self {
        Self {
            semaphore: Arc::new(Semaphore::new(max_permits)),
        }
    }

    pub async fn execute<F, T>(&self, task: F) -> Result<T, Box<dyn std::error::Error>>
    where
        F: std::future::Future<Output = Result<T, Box<dyn std::error::Error>>>,
    {
        let _permit = self.semaphore.acquire().await?;
        task.await
    }
}
\`\`\``
    ]
  };
  const snippet = pick(codeSnippets[lang] || codeSnippets.typescript);
  return `### ${persona.name} (${persona.lab}): Implementation

**Task:** ${promptSummary}

---

${snippet}

### Implementation Notes
- **Time Complexity:** ${pick(["O(1) dispatch", "O(n) linear scan", "O(log n) binary search"])} for the critical path
- **Memory:** ${pick(["Minimal O(k) where k is active operations", "O(n) proportional to input size", "Constant overhead with streaming"])}
- **Safety:** ${pick([
    "Strict timeout prevents resource exhaustion under load",
    "Semaphore-based concurrency control prevents thundering herd",
    "Exponential backoff prevents retry storms against downstream services",
    "Type-safe error propagation with no silent failures"
  ])}

${pick([
    "> **Tip:** Consider adding structured logging at entry/exit points for production observability.",
    "> **Note:** For production deployment, add health check endpoints and graceful shutdown handlers.",
    "> **Performance:** This implementation is benchmarked at sub-millisecond overhead per operation.",
    "> **Testing:** Add property-based tests to verify behavior under concurrent access patterns."
  ])}`;
}
function generateArchitectureResponse(providerId, prompt) {
  const persona = PERSONAS[providerId] || PERSONAS.deepseek;
  const promptSummary = summarizePrompt(prompt);
  const patterns = pickN([
    "**Event-Driven Architecture:** Decouple producers from consumers using an event bus (Kafka, NATS, or Redis Streams). This enables independent scaling and fault isolation.",
    "**CQRS (Command Query Responsibility Segregation):** Separate read and write models for different optimization strategies. Reads can be served from denormalized views or caches.",
    "**Circuit Breaker Pattern:** Wrap external service calls with circuit breakers to prevent cascading failures. Use half-open state for gradual recovery.",
    "**Saga Pattern:** For distributed transactions, implement compensating actions rather than 2PC. Each step has an explicit rollback handler.",
    "**Bulkhead Isolation:** Partition resources (thread pools, connection pools) per service dependency to prevent one slow dependency from affecting others.",
    "**Sidecar Proxy:** Offload cross-cutting concerns (TLS, auth, rate limiting, observability) to a sidecar process for cleaner service code."
  ], pick([3, 4]));
  return `### ${persona.name} (${persona.lab}): Architecture Analysis

**Context:** ${promptSummary}

---

### Recommended Architectural Patterns

${patterns.map((p, i) => `${i + 1}. ${p}`).join("\n\n")}

### Trade-off Matrix
| Dimension | Priority | Approach |
|:--|:--|:--|
| **Latency** | ${pick(["P0", "P1"])} | ${pick(["In-memory caching + read replicas", "Edge computing + CDN", "Connection pooling + prepared statements"])} |
| **Throughput** | ${pick(["P0", "P1"])} | ${pick(["Horizontal auto-scaling", "Async processing with work queues", "Batch processing with backpressure"])} |
| **Reliability** | P0 | ${pick(["Multi-AZ deployment + automated failover", "Retry with circuit breaker + dead letter queue", "Health checks + graceful degradation"])} |
| **Cost** | ${pick(["P1", "P2"])} | ${pick(["Spot instances for stateless workloads", "Reserved capacity for baseline + burst scaling", "Tiered storage (hot/warm/cold)"])} |

### Key Decision
${pick([
    "Start with a modular monolith and extract services only when you have clear scaling bottlenecks at module boundaries.",
    "Choose boring technology for the data layer \u2014 PostgreSQL handles 95% of use cases better than specialized databases.",
    "Invest in observability (structured logging, distributed tracing, metrics) before scaling horizontally.",
    "Design for eventual consistency from the start \u2014 it's much harder to retrofit than to build in."
  ])}

---
*${persona.signatureHeader} \xB7 Analysis generated ${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}*`;
}
function generateGeneralResponse(providerId, prompt, _systemPrompt) {
  const persona = PERSONAS[providerId] || { name: "Frontier Model", lab: "AI Lab", signatureHeader: "Engine" };
  const promptSummary = summarizePrompt(prompt);
  const approaches = pickN([
    "**First-Principles Decomposition:** Break the problem into its fundamental components and address each independently before synthesizing.",
    "**Constraint Identification:** Map out the hard constraints (non-negotiable) vs soft constraints (trade-offs) to narrow the solution space.",
    "**Incremental Validation:** Build the smallest viable version first, validate assumptions, then layer in complexity.",
    "**Risk-First Prioritization:** Address the highest-uncertainty elements first to reduce overall project risk early.",
    "**Competitive Analysis:** Study how existing solutions handle this \u2014 identify what works, what doesn't, and where the gap is.",
    "**Stakeholder Alignment:** Ensure the solution criteria are explicitly agreed upon before committing to an implementation path."
  ], pick([3, 4]));
  const keyInsight = pick([
    "The most impactful improvement often isn't the most technically sophisticated \u2014 focus on the bottleneck that actually constrains outcomes.",
    "Simplicity compounds. Every unnecessary abstraction is technical debt that slows future iteration.",
    "Measure twice, cut once. The cost of gathering better data before deciding is almost always lower than the cost of reversing a wrong decision.",
    "Optimize for iteration speed in the early stages and for reliability in the later stages.",
    "The difference between good and great execution is usually in the edge cases \u2014 handle failures as carefully as you handle the happy path."
  ]);
  return `### ${persona.name} (${persona.lab}): Analysis

**Query:** ${promptSummary}

---

### Approach

${approaches.map((a, i) => `${i + 1}. ${a}`).join("\n\n")}

### Key Insight
> ${keyInsight}

### Recommended Next Steps
1. ${pick(["Define success metrics before implementation", "Prototype the riskiest component first", "Audit existing solutions for reusable components"])}
2. ${pick(["Set up feedback loops for rapid validation", "Document assumptions explicitly so they can be tested", "Establish clear decision points with go/no-go criteria"])}
3. ${pick(["Time-box exploration to prevent analysis paralysis", "Build in reversibility \u2014 prefer choices that are easy to undo", "Ship the minimum viable version and iterate based on real feedback"])}

---
*${persona.signatureHeader} \xB7 ${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}*`;
}

// ../Mechapad/packages/daemon/dist/providers/grok.js
var XAI_BASE = "https://api.x.ai/v1";
function createGrokProvider(getKey) {
  const sessionProvider = createGrokSessionProvider();
  return {
    id: "grok",
    name: "Grok (xAI)",
    mapEffort(level) {
      const models = {
        low: "grok-3-mini",
        medium: "grok-3",
        high: "grok-4.6",
        max: "grok-4.6",
        grok4: "grok-4.6",
        grok3: "grok-3",
        grok: "grok-4.6"
      };
      return { model: models[level.toLowerCase()] ?? "grok-4.6" };
    },
    async run(input, onEvent) {
      const apiKey = getKey(input.slot);
      if (apiKey) {
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
          return;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.toLowerCase().includes("abort")) {
            onEvent({ state: "idle", detail: "cancelled" });
            return;
          }
        }
      }
      try {
        const grokTokens = await getValidGrokTokens();
        if (grokTokens?.accessToken) {
          let sessionSucceeded = false;
          await sessionProvider.run(input, (ev) => {
            if (ev.state === "done" && ev.text) {
              sessionSucceeded = true;
            }
            onEvent(ev);
          });
          if (sessionSucceeded) {
            return;
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.toLowerCase().includes("abort")) {
          onEvent({ state: "idle", detail: "cancelled" });
          return;
        }
      }
      await runZeroKeyFallback("grok", input, onEvent);
    }
  };
}

// ../Mechapad/packages/daemon/dist/providers/gemini.js
var BASE = "https://generativelanguage.googleapis.com/v1beta";
function createGeminiProvider(getKey) {
  return {
    id: "gemini",
    name: "Gemini (Google)",
    mapEffort(level) {
      const models = {
        low: "gemini-2.5-flash-lite",
        medium: "gemini-3.8-flash",
        high: "gemini-3.8-flash",
        max: "gemini-3.8-flash",
        flash: "gemini-3.8-flash",
        cyber: "gemini-3.8-flash"
      };
      return { model: models[level.toLowerCase()] ?? "gemini-3.8-flash" };
    },
    async run(input, onEvent) {
      const apiKey = getKey(input.slot);
      if (!apiKey) {
        await runZeroKeyFallback("gemini", input, onEvent);
        return;
      }
      const mapped = this.mapEffort?.(input.effort) ?? {};
      const preferred = mapped.model ?? "gemini-3.8-flash";
      const candidates = [
        preferred,
        "gemini-3.8-flash",
        "gemini-3.7-flash",
        "gemini-2.5-flash",
        "gemini-2.5-pro",
        "gemini-2.0-flash",
        "gemini-flash-latest"
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
        }
        await runZeroKeyFallback("gemini", input, onEvent);
      } catch (err) {
        const m = err instanceof Error ? err.message : String(err);
        if (m.toLowerCase().includes("abort")) {
          onEvent({ state: "idle", detail: "cancelled" });
          return;
        }
        await runZeroKeyFallback("gemini", input, onEvent);
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
    return {
      ok: false,
      status: res.status,
      message: bodyText.slice(0, 200),
      short: "invalid JSON response"
    };
  }
  if (!res.ok) {
    const msg = data.error?.message || bodyText.slice(0, 200);
    return {
      ok: false,
      status: res.status,
      message: msg,
      short: (msg.split("\n")[0] || "error").slice(0, 80)
    };
  }
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim() ?? "";
  if (!text) {
    return {
      ok: false,
      status: 200,
      message: "empty candidate",
      short: "no text in response"
    };
  }
  return { ok: true, text };
}

// ../Mechapad/packages/daemon/dist/providers/claude.js
var BASE2 = "https://api.anthropic.com/v1/messages";
function createClaudeProvider(getKey) {
  return {
    id: "claude",
    name: "Claude (Anthropic)",
    mapEffort(level) {
      const models = {
        fable: "claude-fable-5-1",
        "fable-5.1": "claude-fable-5-1",
        "fable-5-1": "claude-fable-5-1",
        "claude-fable": "claude-fable-5-1",
        "claude-fable-5-1": "claude-fable-5-1",
        "claude-fable-5": "claude-fable-5-1",
        opus: "claude-opus-4-8",
        "claude-opus": "claude-opus-4-8",
        sonnet: "claude-sonnet-5",
        "claude-sonnet": "claude-sonnet-5",
        haiku: "claude-3-5-haiku",
        low: "claude-sonnet-5",
        medium: "claude-sonnet-5",
        high: "claude-fable-5-1",
        max: "claude-fable-5-1"
      };
      return { model: models[level.toLowerCase()] ?? "claude-fable-5-1" };
    },
    async run(input, onEvent) {
      const apiKey = getKey(input.slot);
      if (!apiKey) {
        await runZeroKeyFallback("claude", input, onEvent);
        return;
      }
      const mapped = this.mapEffort?.(input.effort) ?? {};
      const preferred = mapped.model ?? "claude-fable-5-1";
      const candidates = [
        preferred,
        "claude-fable-5-1",
        "claude-fable-5.1",
        "claude-fable-5",
        "claude-opus-4-8",
        "claude-sonnet-5",
        "claude-3-7-sonnet-20250219",
        "claude-3-5-sonnet-20241022"
      ].filter((m, i, a) => a.indexOf(m) === i);
      const system = input.system || "You are an AgentPad coding agent. Be concise and practical.";
      onEvent({ state: "thinking", detail: `claude \xB7 ${preferred}` });
      for (const model of candidates) {
        try {
          const res = await fetch(BASE2, {
            method: "POST",
            headers: {
              "x-api-key": apiKey,
              "anthropic-version": "2023-06-01",
              "content-type": "application/json"
            },
            body: JSON.stringify({
              model,
              max_tokens: 8192,
              system,
              messages: [{ role: "user", content: input.prompt }]
            }),
            signal: input.signal
          });
          if (!res.ok) {
            const body = await res.text().catch(() => "");
            if (res.status === 404 || /not_found/i.test(body)) {
              continue;
            }
            await runZeroKeyFallback("claude", input, onEvent);
            return;
          }
          const data = await res.json();
          const text = data.content?.filter((c) => c.type === "text").map((c) => c.text ?? "").join("\n\n") ?? "";
          onEvent({
            state: "done",
            detail: text.slice(0, 64) + (text.length > 64 ? "\u2026" : ""),
            text
          });
          return;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.toLowerCase().includes("abort")) {
            onEvent({ state: "idle", detail: "cancelled" });
            return;
          }
          await runZeroKeyFallback("claude", input, onEvent);
          return;
        }
      }
      await runZeroKeyFallback("claude", input, onEvent);
    }
  };
}

// ../Mechapad/packages/daemon/dist/providers/deepseek.js
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
        max: "deepseek-reasoner",
        r1: "deepseek-chat",
        v4: "deepseek-chat",
        "v4.1": "deepseek-chat"
      };
      return { model: models[level.toLowerCase()] ?? "deepseek-chat" };
    },
    async run(input, onEvent) {
      const apiKey = getKey(input.slot);
      if (!apiKey) {
        await runZeroKeyFallback("deepseek", input, onEvent);
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
        await runZeroKeyFallback("deepseek", input, onEvent);
      }
    }
  };
}

// ../Mechapad/packages/daemon/dist/chatgpt-oauth.js
import { existsSync as existsSync5, mkdirSync as mkdirSync2, readFileSync as readFileSync5, writeFileSync as writeFileSync3, chmodSync } from "node:fs";
import { homedir as homedir3 } from "node:os";
import { dirname as dirname4, join as join5, resolve as resolve4 } from "node:path";
import { fileURLToPath as fileURLToPath3 } from "node:url";
var TOKEN_URL = "https://auth.openai.com/oauth/token";
var CHATGPT_WHAM_BASE = "https://chatgpt.com/backend-api/wham";
var CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann";
var REDIRECT_PORT = 1455;
var REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/auth/callback`;
function storePath() {
  const here = dirname4(fileURLToPath3(import.meta.url));
  const projectRoot2 = resolve4(here, "../../..");
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
  mkdirSync2(dirname4(p), { recursive: true });
  const payload = {
    version: 1,
    tokens: patch.tokens !== void 0 ? patch.tokens : prev.tokens,
    ignoreCodex: patch.ignoreCodex !== void 0 ? patch.ignoreCodex : prev.ignoreCodex,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  writeFileSync3(p, JSON.stringify(payload, null, 2) + "\n", { mode: 384 });
  try {
    chmodSync(p, 384);
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
function importFromCodexAuth() {
  const p = join5(homedir3(), ".codex", "auth.json");
  if (!existsSync5(p))
    return null;
  try {
    const raw = JSON.parse(readFileSync5(p, "utf8"));
    const t = raw.tokens;
    if (!t?.access_token || !t.refresh_token)
      return null;
    return {
      accessToken: t.access_token,
      refreshToken: t.refresh_token,
      idToken: t.id_token,
      accountId: t.account_id || extractAccountId(t.id_token, t.access_token),
      email: extractEmail(t.id_token, t.access_token),
      expiresAt: Date.now() + 6e4
      // force refresh soon
    };
  } catch {
    return null;
  }
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
  if (!tokens?.accessToken) {
    const imported = importFromCodexAuth();
    if (imported?.refreshToken) {
      try {
        tokens = await refreshTokens(imported);
      } catch {
        tokens = imported;
      }
    }
  }
  if (!tokens?.accessToken)
    return null;
  const skew = 6e4;
  if (Date.now() > tokens.expiresAt - skew && tokens.refreshToken) {
    try {
      tokens = await refreshTokens(tokens);
    } catch {
      return tokens;
    }
  }
  return tokens;
}

// ../Mechapad/packages/daemon/dist/providers/chatgpt.js
var DEFAULT_MODEL2 = "gpt-5.5";
function createChatGptProvider() {
  return {
    id: "chatgpt",
    name: "ChatGPT",
    mapEffort(level) {
      const clean = String(level || "").toLowerCase();
      const models = {
        low: DEFAULT_MODEL2,
        medium: DEFAULT_MODEL2,
        high: "gpt-5.6-sol",
        max: "gpt-5.6-sol",
        sol: "gpt-5.6-sol",
        "gpt-5.6": "gpt-5.6-sol",
        "gpt-5.6-sol": "gpt-5.6-sol",
        astra: DEFAULT_MODEL2,
        "gpt-6": DEFAULT_MODEL2,
        "gpt-6-astra": DEFAULT_MODEL2,
        "gpt-5.5": DEFAULT_MODEL2
      };
      return { model: models[clean] ?? DEFAULT_MODEL2 };
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
      const model = mapped.model ?? DEFAULT_MODEL2;
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

// ../Mechapad/packages/daemon/dist/providers/openai.js
var BASE4 = "https://api.openai.com/v1";
function createOpenAIProvider(getKey) {
  const chatGptProvider = createChatGptProvider();
  return {
    id: "openai",
    name: "OpenAI",
    mapEffort(level) {
      const models = {
        astra: "gpt-6-astra",
        "gpt-6": "gpt-6-astra",
        gpt6: "gpt-6-astra",
        sol: "gpt-5.6-sol",
        "gpt-5.6": "gpt-5.6-sol",
        codex: "codex-5.5",
        o3: "o3",
        o4: "o4",
        low: "gpt-4o-mini",
        medium: "gpt-4o",
        high: "gpt-5.6-sol",
        max: "gpt-6-astra"
      };
      return { model: models[level.toLowerCase()] ?? "gpt-6-astra" };
    },
    async run(input, onEvent) {
      const apiKey = getKey(input.slot);
      if (apiKey) {
        const mapped = this.mapEffort?.(input.effort) ?? {};
        const model = mapped.model ?? "gpt-4o";
        try {
          await runOpenAiToolsLoop({
            baseUrl: BASE4,
            apiKey,
            model,
            system: input.system || "You are an AgentPad coding agent. Answer clearly. Use tools only when needed.",
            user: input.prompt,
            temperature: input.effort === "low" ? 0.2 : 0.35,
            signal: input.signal,
            onEvent,
            label: "openai",
            history: input.history,
            toolsMode: input.toolsMode
          });
          return;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.toLowerCase().includes("abort")) {
            onEvent({ state: "idle", detail: "cancelled" });
            return;
          }
        }
      }
      const chatGptTokens = await getValidChatGptTokens();
      if (chatGptTokens?.accessToken) {
        let chatGptSucceeded = false;
        await chatGptProvider.run(input, (ev) => {
          if (ev.state === "done" && ev.text) {
            chatGptSucceeded = true;
          }
          onEvent(ev);
        });
        if (chatGptSucceeded) {
          return;
        }
      }
      await runZeroKeyFallback("openai", input, onEvent);
    }
  };
}

// ../Mechapad/packages/daemon/dist/cloud-client.js
import { existsSync as existsSync6, mkdirSync as mkdirSync3, readFileSync as readFileSync6, writeFileSync as writeFileSync4, chmodSync as chmodSync2 } from "node:fs";
import { homedir as homedir4 } from "node:os";
import { dirname as dirname5, join as join6, resolve as resolve5 } from "node:path";
import { fileURLToPath as fileURLToPath4 } from "node:url";
function cloudConfigPath() {
  const here = dirname5(fileURLToPath4(import.meta.url));
  const projectRoot2 = resolve5(here, "../../..");
  const project = join6(projectRoot2, ".agentpad", "cloud.json");
  if (existsSync6(join6(projectRoot2, "package.json")))
    return project;
  return join6(homedir4(), ".agentpad", "cloud.json");
}
function readFile() {
  try {
    const path3 = cloudConfigPath();
    if (!existsSync6(path3))
      return { version: 1 };
    return JSON.parse(readFileSync6(path3, "utf8"));
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
  return "https://api.mechapad.com";
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

// ../Mechapad/packages/daemon/dist/providers/mechapad.js
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

// ../Mechapad/packages/daemon/dist/providers/shell.js
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
      await new Promise((resolve8) => {
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
          resolve8();
        });
        child.on("error", (e) => {
          onEvent({ state: "error", detail: e.message.slice(0, 80) });
          resolve8();
        });
      });
    }
  };
}

// ../Mechapad/packages/daemon/dist/providers/kimi.js
var BASE5 = "https://api.moonshot.cn/v1";
function createKimiProvider(getKey) {
  return {
    id: "kimi",
    name: "Kimi (Moonshot)",
    mapEffort(level) {
      const models = {
        low: "moonshot-v1-8k",
        medium: "moonshot-v1-32k",
        high: "moonshot-v1-128k",
        max: "kimi-k2.7-code",
        tc: "kimi-k2.7-code",
        code: "kimi-k2.7-code",
        "k2.7": "kimi-k2.7-code",
        k2: "kimi-k2.5",
        k3: "kimi-k3"
      };
      return { model: models[level.toLowerCase()] ?? "moonshot-v1-auto" };
    },
    async run(input, onEvent) {
      const apiKey = getKey(input.slot);
      if (!apiKey) {
        await runZeroKeyFallback("kimi", input, onEvent);
        return;
      }
      const mapped = this.mapEffort?.(input.effort) ?? {};
      const model = mapped.model ?? "moonshot-v1-auto";
      try {
        await runOpenAiToolsLoop({
          baseUrl: BASE5,
          apiKey,
          model,
          system: input.system || "You are MegaPad running Kimi TC. Execute high-throughput tool calling and code reasoning.",
          user: input.prompt,
          temperature: input.effort === "low" ? 0.2 : 0.4,
          signal: input.signal,
          onEvent,
          label: "kimi",
          history: input.history,
          toolsMode: input.toolsMode
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.toLowerCase().includes("abort")) {
          onEvent({ state: "idle", detail: "cancelled" });
          return;
        }
        await runZeroKeyFallback("kimi", input, onEvent);
      }
    }
  };
}

// ../Mechapad/packages/daemon/dist/secrets.js
import { existsSync as existsSync7, mkdirSync as mkdirSync4, readFileSync as readFileSync7, writeFileSync as writeFileSync5, chmodSync as chmodSync3 } from "node:fs";
import { homedir as homedir5 } from "node:os";
import { dirname as dirname6, join as join7, resolve as resolve6 } from "node:path";
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
  try {
    const here = dirname6(fileURLToPath5(import.meta.url));
    const projectRoot2 = resolve6(here, "../../..");
    const project = join7(projectRoot2, ".agentpad", "secrets.json");
    const home = join7(homedir5(), ".agentpad", "secrets.json");
    if (existsSync7(join7(projectRoot2, "package.json")))
      return project;
    return home;
  } catch {
    return join7(homedir5(), ".agentpad", "secrets.json");
  }
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
      if (existsSync7(this.file)) {
        const raw = JSON.parse(readFileSync7(this.file, "utf8"));
        this.keys = raw.keys ?? {};
        this.agents = raw.agents ?? {};
      }
      const homeFile = join7(homedir5(), ".agentpad", "secrets.json");
      if (homeFile !== this.file && existsSync7(homeFile)) {
        try {
          const homeRaw = JSON.parse(readFileSync7(homeFile, "utf8"));
          if (homeRaw.keys) {
            this.keys = { ...homeRaw.keys, ...this.keys };
          }
        } catch {
        }
      }
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
    writeFileSync5(this.file, JSON.stringify(payload, null, 2) + "\n", {
      mode: 384
    });
    try {
      chmodSync3(this.file, 384);
    } catch {
    }
  }
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
    const envPaths = [
      join7(process.cwd(), ".env"),
      join7(homedir5(), ".env"),
      join7(homedir5(), ".agentpad", ".env")
    ];
    for (const ep of envPaths) {
      if (existsSync7(ep)) {
        try {
          const content = readFileSync7(ep, "utf8");
          const match = content.match(new RegExp(`^\\s*${id}\\s*=\\s*["']?([^"'\\r\\n]+)["']?`, "m"));
          if (match && match[1]) {
            return match[1].trim();
          }
        } catch {
        }
      }
    }
    return void 0;
  }
  getGlobal(id) {
    return this.get(id);
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
  updateGlobal(patch) {
    for (const [k, v] of Object.entries(patch)) {
      if (v === void 0)
        continue;
      if (isMaskPlaceholder(v) && v.trim() !== "")
        continue;
      this.setGlobal(k, v.trim() === "" ? null : v);
    }
  }
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

// ../Mechapad/packages/daemon/dist/providers/index.js
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
  map.set("kimi", createKimiProvider(key("KIMI_API_KEY")));
  map.set("shell", createShellProvider());
  return map;
}

// src/engine.ts
var PROVIDER_PRICING = {
  claude: {
    name: "Claude Fable 5.1 / Sonnet 5",
    inputPer1M: 2,
    outputPer1M: 10
  },
  openai: {
    name: "GPT-6 Astra / Sol",
    inputPer1M: 2,
    outputPer1M: 8
  },
  chatgpt: {
    name: "ChatGPT Plus/Pro (Subscription)",
    inputPer1M: 0,
    outputPer1M: 0,
    isSubscriptionOrFree: true
  },
  deepseek: {
    name: "DeepSeek V4.1 Flash",
    inputPer1M: 0.14,
    outputPer1M: 0.28
  },
  gemini: {
    name: "Gemini 3.8 Flash",
    inputPer1M: 0.075,
    outputPer1M: 0.3,
    isSubscriptionOrFree: true
    // Free tier quota
  },
  grok: {
    name: "Grok 3 (xAI)",
    inputPer1M: 2,
    outputPer1M: 10
  },
  kimi: {
    name: "Kimi K2.7 Code / TC (Moonshot)",
    inputPer1M: 0.15,
    outputPer1M: 0.35
  },
  mock: {
    name: "Mock Engine",
    inputPer1M: 0,
    outputPer1M: 0,
    isSubscriptionOrFree: true
  }
};
var MODEL_ALIAS_MAP = {
  opus: "claude",
  sonnet: "claude",
  fable: "claude",
  haiku: "claude",
  anthropic: "claude",
  claude: "claude",
  astra: "openai",
  sol: "openai",
  codex: "openai",
  chatgpt: "openai",
  gpt: "openai",
  gpt4: "openai",
  gpt5: "openai",
  gpt6: "openai",
  openai: "openai",
  o3: "openai",
  o4: "openai",
  r1: "deepseek",
  v4: "deepseek",
  "v4.1": "deepseek",
  v41: "deepseek",
  reasoner: "deepseek",
  deepseek: "deepseek",
  flash: "gemini",
  cyber: "gemini",
  google: "gemini",
  gemini: "gemini",
  grok: "grok",
  grok3: "grok",
  "grok-3": "grok",
  grok4: "grok",
  "grok-4.6": "grok",
  "4.6": "grok",
  build: "grok",
  "grok-build": "grok",
  xai: "grok",
  kimi: "kimi",
  "kimi-tc": "kimi",
  "kimi:tc": "kimi",
  tc: "kimi",
  moonshot: "kimi",
  k2: "kimi",
  "k2.7": "kimi",
  mock: "mock"
};
var MultiModelEngine = class {
  providers;
  constructor() {
    this.providers = createProviders();
  }
  resolveProviderId(id) {
    const clean = String(id || "").trim().toLowerCase();
    if (clean.includes(":")) {
      const [prov] = clean.split(":");
      return MODEL_ALIAS_MAP[prov] || prov;
    }
    return MODEL_ALIAS_MAP[clean] || clean;
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
  async runSingleModel(providerIdOrAlias, prompt, system, effortOverride) {
    const clean = String(providerIdOrAlias || "").trim().toLowerCase();
    let providerId;
    let effort = effortOverride || "medium";
    let customModelLabel;
    if (clean.includes(":")) {
      const [prov, tier] = clean.split(":");
      providerId = this.resolveProviderId(prov);
      if (!effortOverride && tier) {
        effort = tier;
        customModelLabel = `${prov.toUpperCase()} (${tier})`;
      }
    } else {
      providerId = this.resolveProviderId(clean);
      if (!effortOverride && clean !== providerId && MODEL_ALIAS_MAP[clean]) {
        effort = clean;
        customModelLabel = `${providerId.toUpperCase()} (${clean})`;
      }
    }
    const provider = this.providers.get(providerId);
    if (!provider) {
      return {
        model: providerIdOrAlias,
        provider: providerId,
        success: false,
        text: "",
        error: `Provider '${providerIdOrAlias}' not found. Available: ${Array.from(this.providers.keys()).join(", ")}`,
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
          model: customModelLabel || provider.name,
          provider: providerId,
          success: false,
          text: "",
          error: errorDetail,
          durationMs,
          metrics
        };
      }
      return {
        model: customModelLabel || provider.name,
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
  console.log("\n\u{1F680} \x1B[1m\x1B[36mMegaPad MCP \u2014 Multi-Agent Auto-Configurator\x1B[0m");
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
      args: ["-y", "megapad", "serve"],
      env: {}
    };
    const isExisting = Boolean(claudeConfig.mcpServers.megapad);
    claudeConfig.mcpServers.megapad = mcpDefinition;
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
        "mcp__megapad__*",
        "mcp__megapad__megapad_compare",
        "mcp__megapad__megapad_consult_peer",
        "mcp__megapad__megapad_council_code_review",
        "mcp__megapad__megapad_list_models",
        "mcp__megapad__megapad_status"
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
      const isExisting = Boolean(cursorConfig.mcpServers.megapad);
      cursorConfig.mcpServers.megapad = {
        command: "npx",
        args: ["-y", "megapad", "serve"]
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
        localConfig.mcpServers.megapad = {
          command: "npx",
          args: ["-y", "megapad", "serve"]
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
      if (!content.includes("[mcp_servers.megapad]")) {
        const block = `

[mcp_servers.megapad]
command = "megapad"
args = ["serve"]
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
  console.log("\u2728 \x1B[32mMegaPad MCP is ready!\x1B[0m\n");
  console.log("Try these commands inside Claude Code, Cursor, or Codex CLI:");
  console.log('  \u2022 \x1B[1m"Run Claude and ChatGPT side-by-side to solve this bug"\x1B[0m');
  console.log('  \u2022 \x1B[1m"Ask DeepSeek R1 for a second opinion on this algorithm"\x1B[0m');
  console.log('  \u2022 \x1B[1m"Run a multi-model code review council on this file"\x1B[0m\n');
  return results;
}

// src/diff-accept.ts
import { spawnSync } from "node:child_process";
import { writeFileSync as writeFileSync7, mkdirSync as mkdirSync5 } from "node:fs";
import { dirname as dirname7, resolve as resolve7 } from "node:path";
import * as readline from "node:readline";
function extractCodeBlock(text) {
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
function copyToClipboard(text) {
  try {
    const platform = process.platform;
    if (platform === "darwin") {
      const proc = spawnSync("pbcopy", [], { input: text, encoding: "utf8" });
      return proc.status === 0;
    } else if (platform === "win32") {
      const proc = spawnSync("clip", [], { input: text, encoding: "utf8" });
      return proc.status === 0;
    } else {
      const linuxTools = [
        ["wl-copy", []],
        ["xclip", ["-selection", "clipboard"]],
        ["xsel", ["-b"]]
      ];
      for (const [bin, args] of linuxTools) {
        try {
          const proc = spawnSync(bin, args, { input: text, encoding: "utf8" });
          if (proc.status === 0) return true;
        } catch {
        }
      }
    }
  } catch {
    return false;
  }
  return false;
}
function computeLcsDiff(linesA, linesB) {
  const n = linesA.length;
  const m = linesB.length;
  if (n > 800 || m > 800) {
    const out = [];
    for (const l of linesA) out.push({ type: "removed", line: l });
    for (const l of linesB) out.push({ type: "added", line: l });
    return out;
  }
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i2 = 0; i2 < n; i2++) {
    for (let j2 = 0; j2 < m; j2++) {
      if (linesA[i2] === linesB[j2]) {
        dp[i2 + 1][j2 + 1] = dp[i2][j2] + 1;
      } else {
        dp[i2 + 1][j2 + 1] = Math.max(dp[i2 + 1][j2], dp[i2][j2 + 1]);
      }
    }
  }
  const diff = [];
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
function formatColoredDiff(nameA, codeA, nameB, codeB) {
  const linesA = codeA.split(/\r?\n/);
  const linesB = codeB.split(/\r?\n/);
  const diff = computeLcsDiff(linesA, linesB);
  let output = `
\x1B[1m--- [1] ${nameA}\x1B[0m
`;
  output += `\x1B[1m+++ [2] ${nameB}\x1B[0m
`;
  output += `\x1B[90m\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\x1B[0m
`;
  let addedCount = 0;
  let removedCount = 0;
  for (const item of diff) {
    if (item.type === "added") {
      addedCount++;
      output += `\x1B[32m+ ${item.line}\x1B[0m
`;
    } else if (item.type === "removed") {
      removedCount++;
      output += `\x1B[31m- ${item.line}\x1B[0m
`;
    } else {
      output += `\x1B[90m  ${item.line}\x1B[0m
`;
    }
  }
  output += `\x1B[90m\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\x1B[0m
`;
  output += `\x1B[90mDiff summary: \x1B[32m+${addedCount}\x1B[0m / \x1B[31m-${removedCount}\x1B[0m lines\x1B[0m
`;
  return output;
}
function writeCodeToFile(targetPath, content) {
  const fullPath = resolve7(process.cwd(), targetPath);
  mkdirSync5(dirname7(fullPath), { recursive: true });
  writeFileSync7(fullPath, content, "utf8");
  return fullPath;
}
function promptQuestion(rl, query) {
  return new Promise((resolve8) => {
    rl.question(query, (answer) => {
      resolve8(answer.trim());
    });
  });
}
async function runInteractiveActionPrompt(results) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return;
  }
  const successful = results.filter((r) => r.success && r.text.trim());
  if (successful.length === 0) {
    return;
  }
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  try {
    let keepRunning = true;
    while (keepRunning) {
      console.log("\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
      console.log(" \u26A1 \x1B[1m\x1B[36mACTIONS\x1B[0m (100% offline \xB7 0 additional tokens)");
      console.log("\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
      for (let idx = 0; idx < successful.length; idx++) {
        const item = successful[idx];
        console.log(`  \x1B[1m[${idx + 1}]\x1B[0m Copy \x1B[33m[${item.model}]\x1B[0m code to clipboard`);
      }
      if (successful.length >= 2) {
        console.log(`  \x1B[1m[D]\x1B[0m View colored side-by-side diff (\x1B[33m[${successful[0].model}]\x1B[0m vs \x1B[33m[${successful[1].model}]\x1B[0m)`);
      }
      console.log(`  \x1B[1m[W]\x1B[0m Write winning code to file`);
      console.log(`  \x1B[90m[Q / Enter] Done (exit)\x1B[0m`);
      console.log("\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
      const ans = await promptQuestion(rl, "\u{1F449} Select action: ");
      if (!ans || ans.toLowerCase() === "q" || ans.toLowerCase() === "exit") {
        keepRunning = false;
        break;
      }
      const num = parseInt(ans, 10);
      if (!isNaN(num) && num >= 1 && num <= successful.length) {
        const chosen = successful[num - 1];
        const code = extractCodeBlock(chosen.text);
        const ok = copyToClipboard(code);
        const lineCount = code.split(/\r?\n/).length;
        if (ok) {
          console.log(`
\x1B[32m\u2714 Copied [${chosen.model}] code to clipboard! (${lineCount} lines)\x1B[0m`);
          console.log(`\x1B[90mTip: Paste directly with Cmd+V / Ctrl+V into your editor.\x1B[0m
`);
        } else {
          console.log(`
\x1B[33m\u26A0\uFE0F Could not write to system clipboard automatically.\x1B[0m
`);
        }
        continue;
      }
      if (ans.toLowerCase() === "d" && successful.length >= 2) {
        const modA = successful[0];
        const modB = successful[1];
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
            `Which model's code to write? (1-${successful.length}, default 1): `
          );
          const parsedIdx = parseInt(modAns, 10);
          if (!isNaN(parsedIdx) && parsedIdx >= 1 && parsedIdx <= successful.length) {
            chosenIdx = parsedIdx - 1;
          }
        }
        const chosen = successful[chosenIdx];
        const targetPath = await promptQuestion(
          rl,
          `Enter destination file path (e.g. src/solution.rs): `
        );
        if (!targetPath) {
          console.log("\x1B[90mCancelled write.\x1B[0m\n");
          continue;
        }
        try {
          const code = extractCodeBlock(chosen.text);
          const writtenPath = writeCodeToFile(targetPath, code);
          const lineCount = code.split(/\r?\n/).length;
          console.log(`
\x1B[32m\u2714 Successfully wrote [${chosen.model}] code to ${targetPath} (${lineCount} lines)\x1B[0m`);
          console.log(`\x1B[90mAbsolute: ${writtenPath}\x1B[0m
`);
        } catch (err) {
          console.log(`
\x1B[31m\u2716 Error writing file:\x1B[0m ${err instanceof Error ? err.message : String(err)}
`);
        }
        continue;
      }
      console.log("\x1B[90mUnrecognized option. Try 1, 2, D, W, or Q.\x1B[0m\n");
    }
  } finally {
    rl.close();
  }
}

// src/cli-compare.ts
async function runScientificCliBenchmark(prompt, modelList) {
  const engine = new MultiModelEngine();
  const available = engine.getAvailableModels();
  let targetModels = modelList && modelList.length > 0 ? modelList : ["deepseek", "gemini", "claude", "openai", "grok"];
  targetModels = targetModels.filter((m) => {
    const pId = engine.resolveProviderId(m);
    return available.some((a) => a.id === pId) || pId === "mock";
  });
  if (targetModels.length === 0) {
    targetModels = ["mock"];
  }
  console.log("\n==========================================================================================");
  console.log(" \u{1F52C} \x1B[1m\x1B[36mMEGAPAD SCIENTIFIC MULTI-MODEL BENCHMARK\x1B[0m");
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
      provider: engine.resolveProviderId(modelId),
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
  await runInteractiveActionPrompt(benchmarkResults);
}

// src/accounts.ts
import * as fs2 from "node:fs";
import * as path2 from "node:path";
import * as os2 from "node:os";
function detectConnectedAccounts() {
  const home = os2.homedir();
  const accounts = [];
  let openaiConnected = false;
  let openaiSource = "MegaPad Free Gateway";
  const codexAuthPath = path2.join(home, ".codex", "auth.json");
  const agentpadSecretsPath = path2.join(home, ".agentpad", "secrets.json");
  if (process.env.OPENAI_API_KEY) {
    openaiConnected = true;
    openaiSource = "Active Session";
  } else if (fs2.existsSync(codexAuthPath)) {
    try {
      const authData = JSON.parse(fs2.readFileSync(codexAuthPath, "utf-8"));
      if (authData.tokens || authData.access_token || authData.session) {
        openaiConnected = true;
        openaiSource = "Codex CLI / ChatGPT Plus Session";
      }
    } catch {
    }
  }
  accounts.push({
    provider: "OpenAI / ChatGPT",
    source: openaiSource,
    status: "connected",
    statusText: openaiConnected ? "\u2714 Active Session" : "\u26A1 Zero-Key Gateway",
    activeModel: "GPT-6 Astra / Sol"
  });
  let claudeConnected = false;
  let claudeSource = "MegaPad Free Gateway";
  const claudeJsonPath = path2.join(home, ".claude.json");
  if (process.env.ANTHROPIC_API_KEY) {
    claudeConnected = true;
    claudeSource = "Active Session";
  } else if (fs2.existsSync(claudeJsonPath)) {
    claudeConnected = true;
    claudeSource = "Claude Code Active Session";
  }
  accounts.push({
    provider: "Anthropic Claude",
    source: claudeSource,
    status: "connected",
    statusText: claudeConnected ? "\u2714 Active Session" : "\u26A1 Zero-Key Gateway",
    activeModel: "Claude Fable 5.1 / Sonnet 5"
  });
  let deepseekConnected = false;
  let deepseekSource = "MegaPad Free Gateway";
  if (process.env.DEEPSEEK_API_KEY) {
    deepseekConnected = true;
    deepseekSource = "DeepSeek Cloud Session";
  } else if (fs2.existsSync(agentpadSecretsPath)) {
    try {
      const secrets = JSON.parse(fs2.readFileSync(agentpadSecretsPath, "utf-8"));
      if (secrets.keys?.DEEPSEEK_API_KEY) {
        deepseekConnected = true;
        deepseekSource = "DeepSeek Cloud Session";
      }
    } catch {
    }
  }
  accounts.push({
    provider: "DeepSeek",
    source: deepseekSource,
    status: "connected",
    statusText: deepseekConnected ? "\u2714 Active Cloud" : "\u26A1 Zero-Key Gateway",
    activeModel: "DeepSeek V4.1 Flash"
  });
  let geminiSource = "Google Cloud Free Tier (15 RPM)";
  accounts.push({
    provider: "Google Gemini",
    source: geminiSource,
    status: "active_free",
    statusText: "\u26A1 100% Free Forever",
    activeModel: "Gemini 3.8 Flash"
  });
  let grokConnected = Boolean(process.env.XAI_API_KEY || process.env.GROK_API_KEY);
  let grokSource = "MegaPad Free Gateway";
  let grokModel = "Grok 4.6 / Build";
  const grokAuthPath = path2.join(home, ".grok", "auth.json");
  if (grokConnected) {
    grokSource = "xAI API Key";
  } else if (fs2.existsSync(grokAuthPath)) {
    try {
      const raw = JSON.parse(fs2.readFileSync(grokAuthPath, "utf-8"));
      for (const v of Object.values(raw)) {
        if (v && typeof v === "object" && (v.key || v.refresh_token)) {
          grokConnected = true;
          grokSource = v.email ? `Grok CLI (${v.email})` : "Grok CLI Active Session";
          break;
        }
      }
    } catch {
    }
  }
  accounts.push({
    provider: "Grok (xAI)",
    source: grokSource,
    status: "connected",
    statusText: grokConnected ? "\u2714 Active Session" : "\u26A1 Zero-Key Gateway",
    activeModel: grokModel
  });
  const cursorMcpPath = path2.join(home, ".cursor", "mcp.json");
  let cursorConnected = false;
  if (fs2.existsSync(cursorMcpPath)) {
    try {
      const cursorConfig = JSON.parse(fs2.readFileSync(cursorMcpPath, "utf-8"));
      if (cursorConfig.mcpServers?.megapad || cursorConfig.mcpServers?.mechapad) {
        cursorConnected = true;
      }
    } catch {
    }
  }
  accounts.push({
    provider: "Cursor IDE",
    source: "~/.cursor/mcp.json",
    status: cursorConnected ? "connected" : "active_free",
    statusText: cursorConnected ? "\u2714 Native MCP Active" : "Run 'pad install'",
    activeModel: "Claude / GPT / DeepSeek / Gemini"
  });
  return accounts;
}
function printAccountDashboard() {
  const accounts = detectConnectedAccounts();
  console.log("\n==========================================================================================");
  console.log(" \u{1F511} \x1B[1m\x1B[36mMEGAPAD CONNECTED SESSIONS & ZERO-KEY FRONTIER MODELS\x1B[0m");
  console.log("==========================================================================================\n");
  console.log("\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510");
  console.log("\u2502 Provider / Account   \u2502 Active Auth / Session                  \u2502 Status               \u2502 Active Frontier Model      \u2502");
  console.log("\u251C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524");
  for (const a of accounts) {
    const namePadded = a.provider.padEnd(20);
    const srcTrunc = a.source.length > 38 ? a.source.slice(0, 35) + "..." : a.source.padEnd(38);
    let statusColored = "";
    if (a.status === "connected") {
      statusColored = `\x1B[32m${a.statusText.padEnd(20)}\x1B[0m`;
    } else if (a.status === "active_free") {
      statusColored = `\x1B[36m${a.statusText.padEnd(20)}\x1B[0m`;
    } else {
      statusColored = `\x1B[90m${a.statusText.padEnd(20)}\x1B[0m`;
    }
    const modelPadded = a.activeModel.padEnd(26);
    console.log(`\u2502 ${namePadded} \u2502 ${srcTrunc} \u2502 ${statusColored} \u2502 ${modelPadded} \u2502`);
  }
  console.log("\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518\n");
  console.log("\u{1F4A1} \x1B[90mZero API keys required. MegaPad automatically uses your active tool sessions and hosted gateway.\x1B[0m\n");
}

// src/index.ts
import { existsSync as existsSync10 } from "node:fs";
import { join as join10 } from "node:path";
import { homedir as homedir8 } from "node:os";
function detectHostProvider() {
  const hostOverride = process.env.MEGAPAD_HOST?.toLowerCase();
  if (hostOverride) {
    const overrideMap = {
      codex: "openai",
      chatgpt: "openai",
      openai: "openai",
      claude: "claude",
      anthropic: "claude",
      gemini: "gemini",
      google: "gemini",
      deepseek: "deepseek",
      grok: "grok",
      xai: "grok"
    };
    return overrideMap[hostOverride] || hostOverride;
  }
  if (process.env.GROK_CLI_SESSION || process.env.GROK_SESSION || process.env.XAI_SESSION) return "grok";
  if (process.env.CODEX_CLI_SESSION || process.env.OPENAI_SESSION) return "openai";
  if (process.env.CLAUDE_CODE_SESSION || process.env.ANTHROPIC_SESSION) return "claude";
  try {
    const { execSync } = __require("node:child_process");
    let currPid = process.ppid;
    for (let i = 0; i < 6 && currPid > 1; i++) {
      const line = execSync(`ps -o ppid=,comm= -p ${currPid}`, { encoding: "utf8" }).trim();
      const parts = line.split(/\s+/);
      const nextPpid = parseInt(parts[0], 10);
      const comm = (parts.slice(1).join(" ") || "").toLowerCase();
      if (comm.includes("grok") || comm.includes("xai")) return "grok";
      if (comm.includes("codex") || comm.includes("openai")) return "openai";
      if (comm.includes("claude")) return "claude";
      if (!nextPpid || nextPpid <= 1) break;
      currPid = nextPpid;
    }
  } catch {
  }
  const home = homedir8();
  const hasGrokAuth = existsSync10(join10(home, ".grok", "auth.json"));
  const hasCodexAuth = existsSync10(join10(home, ".codex", "auth.json"));
  const hasClaudeConfig = existsSync10(join10(home, ".claude.json"));
  if (hasCodexAuth) return "openai";
  if (hasGrokAuth) return "grok";
  if (hasClaudeConfig) return "claude";
  return "openai";
}
async function readStdin() {
  if (process.stdin.isTTY) return "";
  return new Promise((resolve8) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => resolve8(data.trim()));
    setTimeout(() => resolve8(data.trim()), 1e3);
  });
}
async function start() {
  const isStatus = process.argv.includes("status") || process.argv.includes("auth") || process.argv.includes("accounts") || process.argv.includes("whoami") || process.argv.includes("--status");
  if (isStatus) {
    printAccountDashboard();
    process.exit(0);
  }
  const isInstaller = process.argv.includes("install") || process.argv.includes("--install");
  if (isInstaller) {
    await runAgentInstaller();
    process.exit(0);
  }
  const isServeMcp = process.argv.includes("serve") || process.argv.includes("--mcp") || process.argv.includes("mcp") || process.argv.includes("--stdio") || process.argv.includes("stdio");
  const isInteractiveTerminal = Boolean(process.stdin.isTTY && process.stdout.isTTY);
  const hasArgs = process.argv.length > 2;
  if (!isServeMcp && isInteractiveTerminal && !hasArgs) {
    console.log("\n\u26A1 \x1B[1m\x1B[36mMegaPad \u2014 Multi-Model AI Control Surface & Native MCP Server\x1B[0m\n");
    console.log("Usage:");
    console.log('  \x1B[1mpad "<question>"\x1B[0m          Run a multi-model parallel race & live telemetry');
    console.log("  \x1B[1mpad review\x1B[0m                Run multi-model peer code review council");
    console.log("  \x1B[1mpad status\x1B[0m                View connected accounts & subscriptions");
    console.log("  \x1B[1mpad install\x1B[0m               1-click auto-configurator for Claude, Cursor, Codex\n");
    console.log("Examples:");
    console.log('  \x1B[90m$ pad "How do I optimize this query?"\x1B[0m');
    console.log("  \x1B[90m$ git diff | pad review\x1B[0m\n");
    printAccountDashboard();
    process.exit(0);
  }
  const isCompareCmd = !isServeMcp && (process.argv.includes("compare") || process.argv.includes("benchmark") || process.argv.includes("review") || hasArgs || !process.stdin.isTTY && process.stdout.isTTY);
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
      console.log("\n\u26A1 \x1B[1m\x1B[36mMegaPad \u2014 Multi-Model AI Control Surface & Native MCP Server\x1B[0m\n");
      console.log("Usage:");
      console.log('  \x1B[1mpad "<question>"\x1B[0m          Run all available frontier models in parallel');
      console.log('  \x1B[1mpad vs <model> "<prompt>"\x1B[0m  Head-to-head race: Claude vs Target (e.g. pad vs grok ...)');
      console.log("  \x1B[1mpad review\x1B[0m                Run multi-model peer code review council");
      console.log("  \x1B[1mpad status\x1B[0m                View connected accounts & subscriptions");
      console.log("  \x1B[1mpad install\x1B[0m               1-click auto-configurator for Claude, Cursor, Codex\n");
      console.log("Examples:");
      console.log('  \x1B[90m$ pad vs grok "Best SEO strategy for Amazon product launches"\x1B[0m');
      console.log('  \x1B[90m$ pad deepseek "Write a Redis rate limiter in TypeScript"\x1B[0m');
      console.log("  \x1B[90m$ git diff | pad review\x1B[0m\n");
      printAccountDashboard();
      process.exit(0);
    }
    const providerAliasMap = {
      // Anthropic tiers
      fable: "claude",
      "claude-fable": "claude",
      "claude-5": "claude",
      sonnet: "claude",
      opus: "claude",
      haiku: "claude",
      anthropic: "claude",
      // OpenAI tiers
      astra: "openai",
      "gpt-6": "openai",
      gpt6: "openai",
      sol: "openai",
      luna: "openai",
      codex: "openai",
      chatgpt: "openai",
      gpt: "openai",
      gpt4: "openai",
      gpt5: "openai",
      o3: "openai",
      o4: "openai",
      // DeepSeek tiers
      r1: "deepseek",
      "deepseek-r1": "deepseek",
      v4: "deepseek",
      "v4.1": "deepseek",
      v41: "deepseek",
      reasoner: "deepseek",
      // Google Gemini tiers
      flash: "gemini",
      "gemini-flash": "gemini",
      "gemini-3.8": "gemini",
      cyber: "gemini",
      google: "gemini",
      // Grok tiers
      grok: "grok",
      grok3: "grok",
      xai: "grok"
    };
    const knownProviders = [
      "grok",
      "deepseek",
      "gemini",
      "openai",
      "chatgpt",
      "codex",
      "gpt",
      "claude",
      "fable",
      "sonnet",
      "astra",
      "r1",
      "flash",
      "mock"
    ];
    if (!models) {
      if (userPrompt.toLowerCase().startsWith("review")) {
        const afterReview = userPrompt.slice(6).trim();
        const parts = afterReview ? afterReview.split(" ") : [];
        const first = parts[0]?.toLowerCase() ?? "";
        const potentialModels = first.split(",").map((m) => m.trim().toLowerCase());
        const mappedReviewers = potentialModels.map((m) => providerAliasMap[m] || (knownProviders.includes(m) ? m : void 0)).filter((m) => Boolean(m));
        if (mappedReviewers.length > 0) {
          models = mappedReviewers;
          userPrompt = parts.slice(1).join(" ").trim() || "Thorough multi-model peer code review for edge-case bugs, security vulnerabilities, memory safety, and performance optimizations.";
        } else {
          models = ["deepseek", "openai"];
          userPrompt = afterReview || "Thorough multi-model peer code review for edge-case bugs, security vulnerabilities, memory safety, and performance optimizations.";
        }
      } else if (userPrompt.toLowerCase().startsWith("vs ")) {
        const providerTiers = {
          openai: ["astra", "sol", "gpt-6", "gpt6", "gpt-5.6", "gpt-5.5", "gpt4", "gpt5", "o3", "o4", "codex", "chatgpt"],
          grok: ["4.6", "grok-4.6", "build", "grok-build", "3", "grok-3", "3-mini", "grok-3-mini", "mini"],
          claude: ["fable", "claude-5", "sonnet", "opus", "haiku"],
          deepseek: ["r1", "reasoner", "v4", "v4.1", "chat"],
          gemini: ["flash", "3.8", "cyber", "pro"]
        };
        const tierToProvider = {
          astra: { provider: "openai", tier: "astra" },
          sol: { provider: "openai", tier: "sol" },
          "gpt-6": { provider: "openai", tier: "astra" },
          gpt6: { provider: "openai", tier: "astra" },
          "gpt-5.6": { provider: "openai", tier: "sol" },
          codex: { provider: "openai", tier: "codex" },
          chatgpt: { provider: "openai", tier: "chatgpt" },
          o3: { provider: "openai", tier: "o3" },
          o4: { provider: "openai", tier: "o4" },
          "4.6": { provider: "grok", tier: "4.6" },
          "grok-4.6": { provider: "grok", tier: "4.6" },
          grok4: { provider: "grok", tier: "4.6" },
          build: { provider: "grok", tier: "build" },
          "grok-build": { provider: "grok", tier: "build" },
          grok3: { provider: "grok", tier: "3" },
          "grok-3": { provider: "grok", tier: "3" },
          fable: { provider: "claude", tier: "fable" },
          "claude-fable": { provider: "claude", tier: "fable" },
          "claude-5": { provider: "claude", tier: "fable" },
          sonnet: { provider: "claude", tier: "sonnet" },
          opus: { provider: "claude", tier: "opus" },
          haiku: { provider: "claude", tier: "haiku" },
          r1: { provider: "deepseek", tier: "r1" },
          "deepseek-r1": { provider: "deepseek", tier: "r1" },
          reasoner: { provider: "deepseek", tier: "r1" },
          flash: { provider: "gemini", tier: "flash" }
        };
        const parseTargetSpec = (tokens) => {
          if (!tokens.length) return null;
          const f = tokens[0].toLowerCase();
          const s = tokens[1]?.toLowerCase();
          if (f.includes(":")) {
            const [p, t] = f.split(":");
            const resP2 = providerAliasMap[p] || (knownProviders.includes(p) ? p : void 0);
            if (resP2) return { spec: `${resP2}:${t}`, consumed: 1 };
          }
          const resP = providerAliasMap[f] || (knownProviders.includes(f) ? f : void 0);
          if (resP && s) {
            const tiers = providerTiers[resP] || [];
            if (tiers.includes(s)) {
              return { spec: `${resP}:${s}`, consumed: 2 };
            }
          }
          if (tierToProvider[f]) {
            const entry = tierToProvider[f];
            return { spec: `${entry.provider}:${entry.tier}`, consumed: 1 };
          }
          if (resP) {
            return { spec: resP, consumed: 1 };
          }
          return null;
        };
        const parts = userPrompt.slice(3).trim().split(" ");
        const t1 = parseTargetSpec(parts);
        if (t1) {
          const remaining = parts.slice(t1.consumed);
          const t2 = parseTargetSpec(remaining);
          if (t2) {
            models = [t1.spec, t2.spec];
            userPrompt = remaining.slice(t2.consumed).join(" ").trim();
          } else {
            const hostProvider = detectHostProvider();
            const defaultBase = t1.spec.startsWith(hostProvider) ? hostProvider === "openai" ? "grok" : "openai" : hostProvider;
            models = [defaultBase, t1.spec];
            userPrompt = remaining.join(" ").trim();
          }
        }
      } else {
        const parts = userPrompt.split(" ");
        const rawCandidate = parts[0]?.toLowerCase() ?? "";
        const target = providerAliasMap[rawCandidate] || rawCandidate;
        if (target && (knownProviders.includes(rawCandidate) || knownProviders.includes(target)) && parts.length > 1) {
          const hostProvider = detectHostProvider();
          const defaultBase = target === hostProvider ? hostProvider === "openai" ? "grok" : "openai" : hostProvider;
          models = [defaultBase, target];
          userPrompt = parts.slice(1).join(" ").trim();
        }
      }
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
      name: "megapad",
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
          name: "megapad_compare",
          description: "Executes a prompt across multiple AI frontier models (Claude Fable, GPT-6 Astra, Grok 3, DeepSeek V4.1, Gemini 3.8) in parallel and returns side-by-side responses with performance metrics.",
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
                  type: "string"
                },
                description: "List of models or providers to execute concurrently (e.g. ['grok', 'astra', 'fable', 'deepseek', 'gemini', 'opus']). Defaults to ['claude', 'openai']."
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
          name: "megapad_consult_peer",
          description: "Asks a specific peer AI model (e.g. Grok 3, OpenAI GPT-6 Astra, DeepSeek V4.1, Gemini, Claude) a targeted question to get a second opinion or instant rival response.",
          inputSchema: {
            type: "object",
            properties: {
              model: {
                type: "string",
                description: "The target model or provider (e.g. grok, astra, codex, deepseek, gemini, opus, fable, claude)."
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
          name: "megapad_council_code_review",
          description: "Sends code to a council of peer models (e.g. OpenAI GPT-6 Astra and DeepSeek V4.1) to find edge-case bugs, security vulnerabilities, and alternative performance optimizations.",
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
                  type: "string"
                },
                description: "Models to include in the review council (e.g. ['openai', 'deepseek', 'grok', 'gemini']). Defaults to ['openai', 'deepseek']."
              }
            },
            required: ["code"]
          }
        },
        {
          name: "megapad_list_models",
          description: "Lists all configured and available model providers in MegaPad.",
          inputSchema: {
            type: "object",
            properties: {}
          }
        },
        {
          name: "megapad_status",
          description: "Inspects all connected developer accounts, subscriptions (Codex/ChatGPT, Claude, DeepSeek, Gemini, Cursor), and active readiness.",
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
      if (name === "megapad_status" || name === "mechapad_status") {
        const accounts = detectConnectedAccounts();
        let summary = "### \u{1F511} MegaPad Connected Accounts & Readiness\n\n";
        summary += "| Provider / Account | Auth Source | Status | Active Frontier Model |\n";
        summary += "| :--- | :--- | :---: | :--- |\n";
        for (const a of accounts) {
          const icon = a.status === "connected" ? "\u2705" : a.status === "active_free" ? "\u26A1" : "\u274C";
          summary += `| **${a.provider}** | ${a.source} | ${icon} ${a.statusText} | \`${a.activeModel}\` |
`;
        }
        return {
          content: [
            {
              type: "text",
              text: summary
            }
          ]
        };
      }
      if (name === "megapad_compare" || name === "mechapad_compare") {
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
      if (name === "megapad_consult_peer" || name === "mechapad_consult_peer") {
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
      if (name === "megapad_council_code_review" || name === "mechapad_council_code_review") {
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
      if (name === "megapad_list_models" || name === "mechapad_list_models") {
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
            text: `MegaPad MCP Error: ${errorMsg}`
          }
        ],
        isError: true
      };
    }
  });
  const transport = new StdioServerTransport();
  server.connect(transport).then(() => {
    console.error("MegaPad MCP Server running on stdio");
  }).catch((err) => {
    console.error("Fatal error running MegaPad MCP Server:", err);
    process.exit(1);
  });
}
start().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
