// Builds the client with NO_CONTACT=true and fails if anything that leads to me is in the
// output. Run it with `yarn check:no-contact`. See README "No-contact mode".
//
// It scans every text file in packages/client/dist (HTML, JS, CSS, JSON, SVG, source maps)
// and the names of all files, so a contact detail hidden with CSS or left behind a runtime
// check still fails. To scan an existing build without rebuilding: `--no-build [dir]`.
import { execSync } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const skipBuild = args.includes("--no-build");
const verbose = args.includes("--verbose");
const root = resolve(args.find((arg) => !arg.startsWith("--")) ?? join(repoRoot, "packages/client/dist"));

if (!skipBuild) {
  // The Reown project id is public and only needs to be non-empty for the build to take the
  // same path as a deployment; the placeholder is used when the shell does not provide one.
  const env = {
    ...process.env,
    NO_CONTACT: "true",
    VITE_REOWN_PROJECT_ID: process.env.VITE_REOWN_PROJECT_ID || "check-no-contact",
  };
  execSync("yarn workspace @rpsls/client build", { cwd: repoRoot, stdio: "inherit", env });
}

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// The normal deployments of my sites. Each has a no-contact deployment on its `showcase.`
// subdomain, which is the only form allowed in this build.
const NORMAL_DOMAINS = [
  "ashwinarora.com",
  "ashdex.app",
  "lizardpoisonspock.com",
  "hltools.tech",
  "ethtactoe.com",
  "socialnetwrk.in",
  "ethhousie.com",
];

const FORBIDDEN = [
  { name: "email address", pattern: /[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}/gi },
  { name: "mailto:", pattern: /mailto:/gi },
  // A phone link: `tel:` opening a string, or followed by a number. Not the object key `tel:`.
  { name: "tel:", pattern: /(?<=["'`])tel:|(?<![a-z0-9_$])tel:\+?\d/gi },
  { name: "calendly", pattern: /calendly/gi },
  // As a host: `t.me/…` or `//t.me`. Not the minified property access `t.me`.
  { name: "t.me link", pattern: /(?<![a-z0-9.-])t\.me\/|\/\/t\.me(?![a-z0-9-])/gi },
  { name: "wa.me link", pattern: /(?<![a-z0-9.-])wa\.me\/|\/\/wa\.me(?![a-z0-9-])/gi },
  { name: "telegram", pattern: /telegram/gi },
  { name: "whatsapp", pattern: /whatsapp/gi },
  { name: "linkedin", pattern: /linkedin/gi },
  // The lookahead keeps minified code such as `x.components` out of it.
  { name: "x.com / twitter.com", pattern: /(?<![a-z0-9.-])(?:x|twitter)\.com(?![a-z0-9-])/gi },
  { name: "twitter:creator / twitter:site", pattern: /twitter:(?:creator|site)/gi },
  { name: "my handles", pattern: /@ashwin|ashwin-arora|ashwinarora_/gi },
  { name: "github.com/ashwinarora", pattern: /github\.com\/ashwinarora/gi },
  { name: "discord", pattern: /discord/gi },
  ...NORMAL_DOMAINS.map((domain) => ({
    name: `normal domain ${domain}`,
    pattern: new RegExp(`(?<!showcase\\.)(?<![a-z0-9-])${escapeRegExp(domain)}`, "gi"),
  })),
];

// Matches that are known not to be contact details: strings shipped inside the wallet
// libraries (Reown AppKit, WalletConnect, MetaMask SDK, Safe Apps SDK, ua-parser-js), which
// the app never renders. Every entry is a hole in the check, so each one is tied to
//   what     the forbidden pattern it excuses,
//   file     the chunk it may appear in (path under dist/, content hash left open),
//   context  the library code the match must be part of: a hit is excused only when a
//            match of this expression contains it, within CONTEXT characters either side,
//   why      one line on what the string is.
// An entry that excuses nothing fails the check: delete it. Never add an entry for
// something this repo's own code produces, and never widen `context` to a bare word.
const CONTEXT = 60;
const HASH = "[\\w-]{8}";
const chunk = (...names) => new RegExp(`^assets/(?:${names.map(escapeRegExp).join("|")})-${HASH}\\.js$`);
const ALLOWED = [
  {
    what: "telegram",
    file: chunk("index", "core", "index.es", "basic"),
    context: /\bisTelegram\(|\bwindow\.Telegram(?:WebviewProxy(?:Proto)?)?\b|\bloadingTelegram\b/,
    why: "AppKit / WalletConnect detect the Telegram in-app browser to decide how a wallet deep link opens",
  },
  {
    what: "telegram",
    file: chunk("index", "core"),
    context:
      /\b(?:get|set|remove)TelegramSocialProvider\b|\bTELEGRAM_SOCIAL_PROVIDER\b|Unable to (?:get|set|remove) telegram social provider|\bformatTelegramSocialLoginUrl\b|\bcheckExistingTelegramSocialConnection\b|checkExistingSTelegramocialConnection error/,
    why: "AppKit social-login plumbing for a dapp opened inside Telegram; social login is off here (socials: false in main.tsx)",
  },
  {
    what: "telegram",
    file: chunk("index", "telegram"),
    context: new RegExp(
      `\\btelegramSvg\\b|\\btelegram-${HASH}\\.js\\b|\\bswapVerticalSvg,telegram:async\\(\\)=>|\\btron:[\\w$"]+,telegram:[\\w$"]+,twitch:`,
    ),
    why: "AppKit's icon set: the Telegram logo SVG, its lazy chunk and its slot in the alphabetical icon registry",
  },
  {
    what: "t.me link",
    file: chunk("index", "core", "index.es"),
    context: /\.startsWith\("https:\/\/t\.me"\)/,
    why: "WalletConnect tests whether a wallet's own deep link is a Telegram mini app; a comparison, not a link",
  },
  {
    what: "discord",
    file: chunk("index", "core"),
    context: /"(?:x|farcaster)","discord"(?:,"(?:farcaster|apple)"|\]\))/,
    why: "AppKit's list of social-login provider ids; social login is off here (socials: false in main.tsx)",
  },
  {
    what: "discord",
    file: chunk("index"),
    context: /==="discord"&&(?:this\.socialUsername|[\w$]+)\.endsWith\("0"\)/,
    why: "AppKit trims the old discriminator from a Discord social-login username",
  },
  {
    what: "discord",
    file: chunk("index", "discord"),
    context: new RegExp(
      `\\bdiscordSvg\\b|\\bdiscord-${HASH}\\.js\\b|\\bdisconnectSvg,discord:async\\(\\)=>|\\bcursor:[\\w$"]+,discord:[\\w$"]+,ethereum:`,
    ),
    why: "AppKit's icon set: the Discord logo SVG, its lazy chunk and its slot in the alphabetical icon registry",
  },
  {
    what: "discord",
    file: chunk("data-capture"),
    context: /"wallet","discord","mobile"/,
    why: "icon names in the illustration of AppKit's email-capture view, which is off here (email: false in main.tsx)",
  },
  {
    what: "discord",
    file: chunk("index"),
    context: /\.DISCORD="DISCORD"\}\)\([\w$]+\.SafeAppSocialPlatforms\b/,
    why: "Safe Apps SDK enum for a Safe app's own profile links, bundled with wagmi's Safe connector",
  },
  {
    what: "discord",
    file: chunk("metamask-sdk"),
    context: /report this on the Stencil Discord server \(https:\/\/chat\.stenciljs\.com\)/,
    why: "error text of the Stencil runtime inside the MetaMask SDK's install modal",
  },
  {
    what: "linkedin",
    file: chunk("index"),
    context: /\/\(lbbrowser\)\/i,\/\\+\[\(linkedin\)app\\+\]\/i/,
    why: "ua-parser-js user-agent rule for the LinkedIn in-app browser, bundled with the wallet connector SDKs",
  },
].map((entry) => ({ ...entry, context: new RegExp(entry.context.source, "g") }));

const TEXT = new Set([".html", ".js", ".mjs", ".css", ".json", ".xml", ".txt", ".svg", ".map", ".webmanifest", ".md"]);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => (entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)])),
  );
  return files.flat();
}

const used = new Set();
const allowedBy = (file, what, window, start, end) => {
  const entry = ALLOWED.find(
    (allowed) =>
      allowed.what === what &&
      allowed.file.test(file) &&
      [...window.matchAll(allowed.context)].some((m) => m.index <= start && m.index + m[0].length >= end),
  );
  if (entry) used.add(entry);
  return entry;
};

const findings = [];
let excused = 0;
const scan = (file, what, pattern, text, where = "") => {
  for (const hit of text.matchAll(pattern)) {
    const from = Math.max(0, hit.index - CONTEXT);
    const window = text.slice(from, hit.index + hit[0].length + CONTEXT);
    const context = window.replace(/\s+/g, " ");
    if (allowedBy(file, what, window, hit.index - from, hit.index - from + hit[0].length)) {
      excused += 1;
      if (verbose) console.log(`  allowed  ${file}: ${what}${where}: …${context}…`);
      continue;
    }
    findings.push({ file, what: what + where, match: hit[0], context });
  }
};

const files = await walk(root);
let scanned = 0;

for (const path of files) {
  const file = relative(root, path).split("\\").join("/");
  for (const { name: what, pattern } of FORBIDDEN) scan(file, what, pattern, file, " (file name)");
  if (!TEXT.has(extname(path).toLowerCase())) continue;
  scanned += 1;
  const text = await readFile(path, "utf8");
  for (const { name: what, pattern } of FORBIDDEN) scan(file, what, pattern, text);
}

const html = await readFile(join(root, "index.html"), "utf8");
if (!/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html)) {
  findings.push({ file: "index.html", what: "missing noindex", match: '<meta name="robots" content="noindex…">' });
}

const unused = ALLOWED.filter((allowed) => !used.has(allowed));

if (findings.length > 0 || unused.length > 0) {
  console.error(`\ncheck:no-contact FAILED — ${findings.length} finding(s) in ${root}\n`);
  for (const finding of findings) {
    console.error(`  ${finding.file}: ${finding.what}: ${JSON.stringify(finding.match)}`);
    if (finding.context) console.error(`      …${finding.context}…`);
  }
  for (const allowed of unused) {
    console.error(`  allowlist entry matched nothing, delete it: ${allowed.what} in ${allowed.file} (${allowed.why})`);
  }
  console.error(
    "\nTake cross-site links from packages/client/src/lib/noContact.ts and gate contact UI on NO_CONTACT. Allowlist only third-party library strings.",
  );
  process.exit(1);
}

console.log(
  `check:no-contact passed — ${scanned} text files and ${files.length} file names scanned in ${root}, ${excused} third-party match(es) allowed by ${ALLOWED.length} allowlist entries`,
);
