import { randomUUID, timingSafeEqual } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import express from "express";
import helmet from "helmet";
import nodemailer from "nodemailer";

// ── __dirname / __filename don't exist in ES modules; reconstruct them ──
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set("trust proxy", true);
const PORT = Number(process.env.PORT || 5500);

const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, "data");
const SITE_CONFIG_PATH = path.join(DATA_DIR, "site-config.json");
const WORK_ITEMS_PATH = path.join(DATA_DIR, "work-items.json");
const LEADS_PATH = path.join(DATA_DIR, "leads.json");
const MAX_LEADS = 1000;
// ── Static File Middleware ──
// Serve files from the root, src, and public directories
app.use("/src", express.static(path.join(ROOT_DIR, "src")));
app.use("/public", express.static(path.join(ROOT_DIR, "public")));
app.use(express.static(ROOT_DIR, { index: false })); // Serve root files like favicon.svg, screen.png


const DEFAULT_SITE_CONFIG = {
  brandName: "Zentro Labs",
  contactEmail: "hello@zentrolabs.com",
  siteUrl: "https://zentrolabs.com/",
  whatsappUrl: "",
  whatsappPhone: "",
  whatsappPrefillText: "Hi Zentro Labs, I want to start a premium project.",
  copyrightYear: 2026
};

const DEFAULT_WORK_ITEMS = [
  {
    index: "01",
    title: "Monoform Collective",
    category: "E-Commerce / Identity",
    description: "A conversion-focused commerce experience engineered to feel gallery-grade while preserving fast checkout flow.",
    altText: "Abstract editorial composition in deep slate and blue tones.",
    toneA: "#3f5e63",
    toneB: "#6f888f",
    layout: "feature"
  },
  {
    index: "02",
    title: "Nexus Sync",
    category: "SaaS / Product Narrative",
    description: "A modular marketing platform balancing investor-level clarity with onboarding simplicity for enterprise buyers.",
    altText: "Soft beige editorial panel with minimal geometric accents.",
    toneA: "#d6c4ad",
    toneB: "#efe6db",
    layout: "tall"
  },
  {
    index: "03",
    title: "Haus & Bauhaus",
    category: "Real Estate / Experience",
    description: "An architectural showcase site where immersive storytelling and lead qualification coexist without friction.",
    altText: "Muted ivory gradient with layered circular overlays.",
    toneA: "#ddd6c6",
    toneB: "#f4eee2",
    layout: "offset"
  },
  {
    index: "04",
    title: "Orbit Ledger",
    category: "FinTech / Web App",
    description: "A premium product landing ecosystem that increased demo intent and reduced drop-off in core decision paths.",
    altText: "Editorial steel-blue gradient with atmospheric highlights.",
    toneA: "#3b4d57",
    toneB: "#8ea3ad",
    layout: "balanced"
  }
];

let mailTransporter;
let inMemoryLeads = [];

function sanitizeSingleLine(value, maxLength) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}

function sanitizeMessage(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function safeTokenEquals(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function getClientIdentifier(req) {
  const candidateIp =
    (Array.isArray(req.ips) && req.ips.length ? req.ips[0] : req.ip) ||
    req.socket?.remoteAddress ||
    "unknown";
  return sanitizeSingleLine(candidateIp, 120) || "unknown";
}

function createRateLimiter({ windowMs, max, errorMessage }) {
  const store = new Map();

  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, value] of store.entries()) {
      if (value.resetAt <= now) {
        store.delete(key);
      }
    }
  }, Math.max(10000, Math.floor(windowMs / 2)));
  if (typeof cleanupInterval.unref === "function") {
    cleanupInterval.unref();
  }

  return (req, res, next) => {
    const key = `${getClientIdentifier(req)}:${req.path}`;
    const now = Date.now();
    const hit = store.get(key);

    if (!hit || hit.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    hit.count += 1;
    if (hit.count > max) {
      const retryAfter = Math.max(1, Math.ceil((hit.resetAt - now) / 1000));
      res.set("Retry-After", String(retryAfter));
      return res.status(429).json({ ok: false, error: errorMessage });
    }

    return next();
  };
}

async function readJson(filePath, fallbackValue) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return fallbackValue;
    }

    console.error(`Failed to read ${path.basename(filePath)}:`, error.message);
    return fallbackValue;
  }
}

async function writeJson(filePath, value) {
  const payload = `${JSON.stringify(value, null, 2)}\n`;
  await fs.writeFile(filePath, payload, "utf8");
}

async function ensureDataFiles() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  const files = [
    { path: SITE_CONFIG_PATH, defaultValue: DEFAULT_SITE_CONFIG },
    { path: WORK_ITEMS_PATH, defaultValue: DEFAULT_WORK_ITEMS },
    { path: LEADS_PATH, defaultValue: [] }
  ];

  for (const item of files) {
    try {
      await fs.access(item.path);
    } catch {
      await writeJson(item.path, item.defaultValue);
    }
  }
}

function isReadOnlyFsError(error) {
  return Boolean(error) && ["EROFS", "EPERM", "EACCES", "ENOENT"].includes(error.code);
}

function trimLeads(leads) {
  const safeLeads = Array.isArray(leads) ? leads : [];
  if (safeLeads.length > MAX_LEADS) {
    safeLeads.length = MAX_LEADS;
  }
  return safeLeads;
}

async function getLeads() {
  const leads = await readJson(LEADS_PATH, inMemoryLeads);
  return trimLeads(leads);
}

async function persistLead(lead) {
  const nextLeads = [lead, ...(await getLeads())];
  trimLeads(nextLeads);

  try {
    await writeJson(LEADS_PATH, nextLeads);
  } catch (error) {
    if (isReadOnlyFsError(error)) {
      // Serverless environments can have read-only file systems.
      inMemoryLeads = nextLeads;
      return false;
    }
    throw error;
  }

  inMemoryLeads = nextLeads;
  return true;
}

function getMailerConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const notificationEmail = process.env.NOTIFICATION_EMAIL;

  if (!host || !user || !pass || !notificationEmail) {
    return null;
  }

  return {
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    notificationEmail,
    fromEmail: process.env.SMTP_FROM || user
  };
}

function getTransporter(config) {
  if (!mailTransporter) {
    mailTransporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth
    });
  }

  return mailTransporter;
}

async function sendLeadNotification(lead, siteConfig) {
  const mailConfig = getMailerConfig();
  if (!mailConfig) {
    return;
  }

  const transporter = getTransporter(mailConfig);
  const textBody = [
    `New website lead received for ${siteConfig.brandName}`,
    "",
    `Name: ${lead.name}`,
    `Email: ${lead.email}`,
    `Project Type: ${lead.projectType}`,
    `Submitted: ${lead.receivedAt}`,
    "",
    "Message:",
    lead.message
  ].join("\n");

  await transporter.sendMail({
    from: mailConfig.fromEmail,
    to: mailConfig.notificationEmail,
    replyTo: lead.email,
    subject: `[${siteConfig.brandName}] New inquiry from ${lead.name}`,
    text: textBody
  });
}

const isProduction = process.env.NODE_ENV === "production";
const contactLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 12,
  errorMessage: "Too many contact requests from this IP. Please try again shortly."
});
const adminLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  errorMessage: "Too many admin requests from this IP. Please retry later."
});

app.disable("x-powered-by");
app.use(
  helmet({
    referrerPolicy: { policy: "no-referrer" },
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "base-uri": ["'self'"],
        "default-src": ["'self'"],
        "font-src": ["'self'", "https://fonts.gstatic.com"],
        "form-action": ["'self'", "mailto:"],
        "img-src": ["'self'", "data:", "https:"],
        "media-src": ["'self'", "https://res.cloudinary.com"],
        "object-src": ["'none'"],
        "script-src": ["'self'", "'unsafe-inline'"],
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        "upgrade-insecure-requests": isProduction ? [] : null
      }
    }
  })
);
app.use(express.json({ limit: "200kb" }));
app.use(express.urlencoded({ extended: false, limit: "50kb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "zentro-labs-api",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/config", async (_req, res) => {
  const config = await readJson(SITE_CONFIG_PATH, DEFAULT_SITE_CONFIG);
  res.json({
    brandName: sanitizeSingleLine(config.brandName, 80) || DEFAULT_SITE_CONFIG.brandName,
    contactEmail: sanitizeSingleLine(config.contactEmail, 120) || DEFAULT_SITE_CONFIG.contactEmail,
    siteUrl: sanitizeSingleLine(config.siteUrl, 180) || DEFAULT_SITE_CONFIG.siteUrl,
    whatsappUrl: sanitizeSingleLine(config.whatsappUrl, 240),
    whatsappPhone: sanitizeSingleLine(config.whatsappPhone, 30),
    whatsappPrefillText: sanitizeSingleLine(config.whatsappPrefillText, 240) || DEFAULT_SITE_CONFIG.whatsappPrefillText,
    copyrightYear: Number(config.copyrightYear) || DEFAULT_SITE_CONFIG.copyrightYear
  });
});

app.get("/api/work-items", async (_req, res) => {
  const items = await readJson(WORK_ITEMS_PATH, DEFAULT_WORK_ITEMS);
  const safeItems = Array.isArray(items) ? items : DEFAULT_WORK_ITEMS;
  res.json({ items: safeItems });
});

app.post("/api/contact", contactLimiter, async (req, res) => {
  try {
    const name = sanitizeSingleLine(req.body.name, 120);
    const email = sanitizeSingleLine(req.body.email, 160).toLowerCase();
    const projectType = sanitizeSingleLine(req.body.projectType || "General Inquiry", 120);
    const message = sanitizeMessage(req.body.message, 4000);

    if (!name || !email || !message) {
      return res.status(400).json({ ok: false, error: "Name, email, and message are required." });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ ok: false, error: "Please provide a valid email address." });
    }

    const lead = {
      id: randomUUID(),
      receivedAt: new Date().toISOString(),
      name,
      email,
      projectType,
      message,
      userAgent: sanitizeSingleLine(req.get("user-agent"), 300)
    };

    const persisted = await persistLead(lead);
    if (!persisted) {
      console.warn("Lead persistence fell back to in-memory storage (read-only FS).");
    }

    const siteConfig = await readJson(SITE_CONFIG_PATH, DEFAULT_SITE_CONFIG);
    try {
      await sendLeadNotification(lead, siteConfig);
    } catch (error) {
      console.error("Lead email notification failed:", error.message);
    }

    return res.status(201).json({
      ok: true,
      message: "Thanks. Your brief has been received. We will contact you shortly.",
      leadId: lead.id
    });
  } catch (error) {
    console.error("Contact submission failed:", error);
    return res.status(500).json({
      ok: false,
      error: "Submission failed unexpectedly. Please email us directly at hello@zentrolabs.com."
    });
  }
});

app.get("/api/leads", adminLimiter, async (req, res) => {
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) {
    return res.status(403).json({ ok: false, error: "Admin endpoint is disabled." });
  }

  if (Object.prototype.hasOwnProperty.call(req.query || {}, "token")) {
    return res.status(400).json({
      ok: false,
      error: "Query token auth is disabled. Use x-admin-token header."
    });
  }

  const inboundToken = String(req.get("x-admin-token") || "").trim();
  if (!safeTokenEquals(inboundToken, adminToken)) {
    return res.status(401).json({ ok: false, error: "Unauthorized." });
  }

  const leads = await getLeads();
  return res.json({ ok: true, leads });
});

app.use("/data", (_req, res) => {
  res.status(403).json({ ok: false, error: "Forbidden." });
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(ROOT_DIR, "index.html"));
});


app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ ok: false, error: "Not found." });
  }

  if (path.extname(req.path)) {
    return res.status(404).send("Not found.");
  }

  return res.sendFile(path.join(ROOT_DIR, "index.html"));
});

// ── ESM equivalent of `module.exports = app` ──
export default app;

// ── ESM equivalent of `if (require.main === module)` ──
const isMainModule = process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isMainModule) {
  ensureDataFiles()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Zentro Labs server running on http://localhost:${PORT}`);
      });
    })
    .catch((error) => {
      console.error("Server startup failed:", error);
    });
} else {
  // Always try to initialize data files, but ignore errors (e.g., read-only FS on Vercel)
  ensureDataFiles().catch(() => {});
}

