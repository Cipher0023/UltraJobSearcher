import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import { runCollection } from "./collector.js";
import { 
  getAllCollections, 
  getJobsByCollection, 
  getCollectionStats,
  searchJobs,
  deleteCollection 
} from "./database.js";

const app = express();
app.use(helmet());
app.use(cors());
app.use(bodyParser.json({ limit: "2mb" }));

// Store para clientes SSE
const clients = new Set();

// Health
app.get("/api/health", (req, res) => res.json({ ok: true }));

// Discover sources from pasted domains
app.post("/api/discover", (req, res) => {
  const { domains } = req.body; // array of strings
  // simple detection based on hostname
  const known = [];
  for (const d of domains) {
    try {
      const u = new URL(d.includes("://") ? d : `https://${d}`);
      const host = u.hostname.replace("www.", "");
      if (host.includes("linkedin")) known.push({ key: "linkedin", host });
      else if (host.includes("indeed")) known.push({ key: "indeed", host });
      else if (host.includes("gupy")) known.push({ key: "gupy", host });
      else if (host.includes("greenhouse"))
        known.push({ key: "greenhouse", host });
      else if (host.includes("lever")) known.push({ key: "lever", host });
      else if (host.includes("vagas")) known.push({ key: "vagas", host });
      else known.push({ key: "generic", host });
    } catch (e) {
      // fallback: take the raw string
      known.push({ key: "generic", host: d });
    }
  }
  // unique
  const uniq = Array.from(
    new Map(known.map((s) => [s.key + "|" + s.host, s])).values()
  );
  res.json({ sources: uniq });
});

// SSE endpoint para progresso em tempo real
app.get("/api/progress", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  clients.add(res);

  req.on("close", () => {
    clients.delete(res);
  });
});

// Função para enviar progresso para todos os clientes
export function sendProgress(data) {
  clients.forEach((client) => {
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  });
}

// Run a collection
app.post("/api/collect", async (req, res) => {
  const { roles, sources, options } = req.body;
  try {
    const result = await runCollection({ roles, sources, options });
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Buscar todas as coleções
app.get("/api/collections", (req, res) => {
  try {
    const collections = getAllCollections();
    res.json({ ok: true, collections });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Buscar jobs de uma coleção
app.get("/api/collections/:id/jobs", (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 100, offset = 0 } = req.query;
    const jobs = getJobsByCollection(parseInt(id), parseInt(limit), parseInt(offset));
    res.json({ ok: true, jobs });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Buscar estatísticas de uma coleção
app.get("/api/collections/:id/stats", (req, res) => {
  try {
    const { id } = req.params;
    const stats = getCollectionStats(parseInt(id));
    res.json({ ok: true, stats });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Buscar jobs por termo
app.get("/api/search", (req, res) => {
  try {
    const { q, limit = 50 } = req.query;
    if (!q) {
      return res.status(400).json({ ok: false, error: "Query parameter 'q' is required" });
    }
    const jobs = searchJobs(q, parseInt(limit));
    res.json({ ok: true, jobs });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Deletar coleção
app.delete("/api/collections/:id", (req, res) => {
  try {
    const { id } = req.params;
    deleteCollection(parseInt(id));
    res.json({ ok: true, message: "Collection deleted" });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server listening ${PORT}`));
