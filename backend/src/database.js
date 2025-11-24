import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "..", "jobs.db");
const db = new Database(dbPath);

// Criar tabelas
db.exec(`
  CREATE TABLE IF NOT EXISTS collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    roles TEXT NOT NULL,
    sources TEXT NOT NULL,
    total_jobs INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    collection_id INTEGER NOT NULL,
    title TEXT,
    company TEXT,
    location TEXT,
    description TEXT,
    url TEXT UNIQUE,
    source TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (collection_id) REFERENCES collections(id)
  );

  CREATE INDEX IF NOT EXISTS idx_jobs_collection ON jobs(collection_id);
  CREATE INDEX IF NOT EXISTS idx_jobs_source ON jobs(source);
  CREATE INDEX IF NOT EXISTS idx_jobs_url ON jobs(url);
`);

// Criar nova coleção
export function createCollection(roles, sources) {
  const stmt = db.prepare(`
    INSERT INTO collections (roles, sources)
    VALUES (?, ?)
  `);
  
  const result = stmt.run(
    JSON.stringify(roles),
    JSON.stringify(sources)
  );
  
  return result.lastInsertRowid;
}

// Adicionar job à coleção
export function addJob(collectionId, job) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO jobs (collection_id, title, company, location, description, url, source)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  try {
    stmt.run(
      collectionId,
      job.title || null,
      job.company || null,
      job.location || null,
      job.description || null,
      job.url || null,
      job.source
    );
    return true;
  } catch (err) {
    console.warn("Erro ao inserir job:", err.message);
    return false;
  }
}

// Atualizar total de jobs na coleção
export function updateCollectionTotal(collectionId) {
  const count = db.prepare(`
    SELECT COUNT(*) as total FROM jobs WHERE collection_id = ?
  `).get(collectionId);
  
  db.prepare(`
    UPDATE collections SET total_jobs = ? WHERE id = ?
  `).run(count.total, collectionId);
}

// Buscar todas as coleções
export function getAllCollections() {
  return db.prepare(`
    SELECT 
      id,
      created_at,
      roles,
      sources,
      total_jobs
    FROM collections
    ORDER BY created_at DESC
  `).all();
}

// Buscar jobs de uma coleção
export function getJobsByCollection(collectionId, limit = 100, offset = 0) {
  return db.prepare(`
    SELECT 
      id,
      title,
      company,
      location,
      description,
      url,
      source,
      created_at
    FROM jobs
    WHERE collection_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(collectionId, limit, offset);
}

// Buscar estatísticas de uma coleção
export function getCollectionStats(collectionId) {
  const stats = db.prepare(`
    SELECT 
      source,
      COUNT(*) as count
    FROM jobs
    WHERE collection_id = ?
    GROUP BY source
  `).all(collectionId);
  
  return stats;
}

// Buscar jobs por termo de busca
export function searchJobs(searchTerm, limit = 50) {
  return db.prepare(`
    SELECT 
      j.id,
      j.title,
      j.company,
      j.location,
      j.description,
      j.url,
      j.source,
      j.created_at,
      c.roles
    FROM jobs j
    JOIN collections c ON j.collection_id = c.id
    WHERE 
      j.title LIKE ? OR
      j.company LIKE ? OR
      j.description LIKE ?
    ORDER BY j.created_at DESC
    LIMIT ?
  `).all(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, limit);
}

// Deletar coleção e seus jobs
export function deleteCollection(collectionId) {
  db.prepare(`DELETE FROM jobs WHERE collection_id = ?`).run(collectionId);
  db.prepare(`DELETE FROM collections WHERE id = ?`).run(collectionId);
}

export default db;
