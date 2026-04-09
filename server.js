import { randomUUID, timingSafeEqual } from "crypto";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

import express from "express";
import helmet from "helmet";
import nodemailer from "nodemailer";

// Reconstruct __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = __dirname;

const app = express();
app.set("trust proxy", true);
const PORT = Number(process.env.PORT || 5500);

const DATA_DIR = path.join(ROOT_DIR, "data");
const SITE_CONFIG_PATH = path.join(DATA_DIR, "site-config.json");
const WORK_ITEMS_PATH = path.join(DATA_DIR, "work-items.json");
const LEADS_PATH = path.join(DATA_DIR, "leads.json");
const MAX_LEADS = 1000;

// Default Data
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
  { index: "01", title: "Monoform Collective", category: "E-Commerce / Identity", description: "A conversion-focused commerce experience engineered to feel gallery-grade while preserving fast checkout flow.", toneA: "#3f5e63", toneB: "#6f888f", layout: "feature" },
  { index: "02", title: "Nexus Sync", category: "SaaS / Product Narrative", description: "A modular marketing platform balancing investor-level clarity with onboarding simplicity for enterprise buyers.", toneA: "#d6c4ad", toneB: "#efe6db", layout: "tall" },
  { index: "03", title: "Haus & Bauhaus", category: "Real Estate / Experience", description: "An architectural showcase site where immersive storytelling and lead qualification coexist without friction.", toneA: "#ddd6c6", toneB: "#f4eee2", layout: "offset" },
  { index: "04", title: "Orbit Ledger", category: "FinTech / Web App", description: "A premium product landing ecosystem that increased demo intent and reduced drop-off in core decision paths.", toneA: "#3b4d57", toneB: "#8ea3ad", layout: "balanced" }
];

let inMemoryLeads = [];
let mailTransporter;

// ── Static File Middleware ──
app.use("/src", express.static(path.join(ROOT_DIR, "src")));
app.use("/public", express.static(path.join(ROOT_DIR, "public")));
app.use(express.static(ROOT_DIR, { index: false }));

// Middlewares
app.disable("x-powered-by");
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "img-src": ["'self'", "data:", "https:"],
      "media-src": ["'self'", "https://res.cloudinary.com"],
      "script-src": ["'self'", "'unsafe-inline'"],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"]
    }
  }
}));
app.use(express.json({ limit: "200kb" }));
app.use(express.urlencoded({ extended: false, limit: "50kb" }));

// Helper: Read JSON (Fallback to Default)
async function readJson(filePath, fallbackValue) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallbackValue;
  }
}

// Routes
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.get("/api/config", async (_req, res) => {
  const config = await readJson(SITE_CONFIG_PATH, DEFAULT_SITE_CONFIG);
  res.json(config);
});

app.get("/api/work-items", async (_req, res) => {
  const items = await readJson(WORK_ITEMS_PATH, DEFAULT_WORK_ITEMS);
  res.json({ items });
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(ROOT_DIR, "index.html"));
});

app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ ok: false });
  if (path.extname(req.path)) return res.status(404).send("Not found");
  res.sendFile(path.join(ROOT_DIR, "index.html"));
});

// Export for Vercel
export default app;

// Listen only if run directly
const isMain = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
