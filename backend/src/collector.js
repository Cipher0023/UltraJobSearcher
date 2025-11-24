import { launchBrowser, randomUserAgent } from "./playwrightManager.js";
import { sendProgress } from "./server.js";
import { createCollection, addJob, updateCollectionTotal } from "./database.js";
import PQueue from "p-queue";
import fs from "fs/promises";
import path from "path";

// import adapters
import * as linkedin from "./adapters/linkedin.js";
import * as indeed from "./adapters/indeed.js";
import * as gupy from "./adapters/gupy.js";
import * as greenhouse from "./adapters/greenhouse.js";
import * as lever from "./adapters/lever.js";
import * as vagas from "./adapters/vagas.js";
import * as genericAdapter from "./adapters/genericAdapter.js";

const ADAPTERS = {
  linkedin,
  indeed,
  gupy,
  greenhouse,
  lever,
  vagas,
  generic: genericAdapter,
};

export async function runCollection({
  roles = [],
  sources = [],
  options = {},
}) {
  const concurrency = options.concurrency || 3;
  const pagesPerSource = options.pagesPerSource || 30;
  const browser = await launchBrowser({ headful: options.headful || false });
  const queue = new PQueue({ concurrency });
  const results = [];
  
  // Criar coleção no banco
  const collectionId = createCollection(roles, sources.map(s => s.key));

  for (const src of sources) {
    const adapter = ADAPTERS[src.key] || ADAPTERS["generic"];
    for (const role of roles) {
      queue.add(async () => {
        const ctx = {
          browser,
          userAgent: randomUserAgent(),
          role,
          pagesPerSource,
          src,
        };
        try {
          sendProgress({ 
            type: "start", 
            source: src.key, 
            role,
            message: `Iniciando busca em ${src.key} para "${role}"` 
          });

          const jobs = await adapter.collect(ctx);
          
          sendProgress({ 
            type: "complete", 
            source: src.key, 
            role,
            count: jobs.length,
            message: `${src.key}: ${jobs.length} vagas encontradas` 
          });

          // Salvar jobs no banco
          for (const j of jobs) {
            addJob(collectionId, j);
            results.push(j);
          }
        } catch (err) {
          console.warn("Adapter error", src.key, err.message);
          sendProgress({ 
            type: "error", 
            source: src.key, 
            role,
            error: err.message,
            message: `Erro em ${src.key}: ${err.message}` 
          });
        }
      });
    }
  }

  await queue.onIdle();
  await browser.close();

  // Atualizar total de jobs na coleção
  updateCollectionTotal(collectionId);

  // normalize + dedupe by url
  const dedup = Array.from(
    new Map(
      results.map((r) => [r.url || r.title + "|" + r.company, r])
    ).values()
  );

  // persist (manter backup em arquivos)
  const outDir = path.resolve(process.cwd(), "collected");
  await fs.mkdir(outDir, { recursive: true });
  const jsonPath = path.join(outDir, `jobs-${Date.now()}.json`);
  await fs.writeFile(jsonPath, JSON.stringify(dedup, null, 2));

  // CSV (simple)
  const csvPath = jsonPath.replace(/\.json$/, ".csv");
  const header = Object.keys(
    dedup[0] || {
      title: "",
      company: "",
      location: "",
      source: "",
      url: "",
      description: "",
    }
  );
  const rows = dedup.map((r) => header.map((h) => (r[h] || "").toString()));
  const csvContent = [
    header.join(","),
    ...rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")),
  ].join("\n");
  await fs.writeFile(csvPath, csvContent);

  return { 
    collectionId,
    json: jsonPath, 
    csv: csvPath, 
    count: dedup.length 
  };
}
