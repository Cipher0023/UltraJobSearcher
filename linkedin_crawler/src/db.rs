use anyhow::Result;
use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::sync::Mutex;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Company {
    pub company_id: Option<i64>,
    pub name: String,
    pub country: Option<String>,
    pub website: Option<String>,
    pub linkedin_url: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct JobListing {
    pub job_id: Option<i64>,
    pub company_id: i64,
    pub job_title: String,
    pub place: Option<String>,
    pub description: Option<String>,
    pub url: String,
    pub source: String,
    pub posted_at: Option<String>,
    // Nome da empresa conforme extraído da vaga (para uso na UI e upsert da Company)
    pub company_name: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Skill {
    pub skill_id: Option<i64>,
    pub skill: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct JobSkill {
    pub job_id: i64,
    pub skill_id: i64,
    pub weight: Option<f32>,
}

#[derive(Clone)]
pub struct Database {
    inner: Arc<Mutex<Connection>>,
}

impl Database {
    pub fn new(path: &str) -> Result<Self> {
        let conn = Connection::open(path)?;

        // Tabela Company
        conn.execute(
            "CREATE TABLE IF NOT EXISTS Company (
                company_id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                country TEXT,
                website TEXT,
                linkedin_url TEXT
            )",
            [],
        )?;

        // Tabela jobs
        conn.execute(
            "CREATE TABLE IF NOT EXISTS jobs (
                job_id INTEGER PRIMARY KEY AUTOINCREMENT,
                company_id INTEGER NOT NULL,
                jobTitle TEXT NOT NULL,
                place TEXT,
                description TEXT,
                url TEXT NOT NULL,
                source TEXT NOT NULL,
                posted_at TEXT,
                FOREIGN KEY(company_id) REFERENCES Company(company_id)
            )",
            [],
        )?;

        // Tabela Skills
        conn.execute(
            "CREATE TABLE IF NOT EXISTS Skills (
                skill_id INTEGER PRIMARY KEY AUTOINCREMENT,
                skill TEXT NOT NULL UNIQUE
            )",
            [],
        )?;

        // Tabela JobSkills (relação N:N entre jobs e skills)
        conn.execute(
            "CREATE TABLE IF NOT EXISTS JobSkills (
                job_id INTEGER NOT NULL,
                skill_id INTEGER NOT NULL,
                weight REAL,
                PRIMARY KEY (job_id, skill_id),
                FOREIGN KEY(job_id) REFERENCES jobs(job_id),
                FOREIGN KEY(skill_id) REFERENCES Skills(skill_id)
            )",
            [],
        )?;

        Ok(Self { inner: Arc::new(Mutex::new(conn)) })
    }

    pub fn upsert_company(&self, company: &Company) -> Result<i64> {
        let conn = self.inner.lock().unwrap();

        conn.execute(
            "INSERT INTO Company (name, country, website, linkedin_url)
             VALUES (?1, ?2, ?3, ?4)
             ON CONFLICT(name) DO UPDATE SET
                country = COALESCE(excluded.country, Company.country),
                website = COALESCE(excluded.website, Company.website),
                linkedin_url = COALESCE(excluded.linkedin_url, Company.linkedin_url)",
            params![
                company.name,
                company.country,
                company.website,
                company.linkedin_url,
            ],
        )?;

        let mut stmt = conn.prepare("SELECT company_id FROM Company WHERE name = ?1")?;
        let mut rows = stmt.query(params![company.name])?;
        if let Some(row) = rows.next()? {
            let id: i64 = row.get(0)?;
            Ok(id)
        } else {
            anyhow::bail!("Falha ao recuperar company_id após upsert");
        }
    }

    pub fn save_job(&self, job: &JobListing) -> Result<()> {
        let conn = self.inner.lock().unwrap();
        conn.execute(
            "INSERT INTO jobs (company_id, jobTitle, place, description, url, source, posted_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                job.company_id,
                job.job_title,
                job.place,
                job.description,
                job.url,
                job.source,
                job.posted_at,
            ],
        )?;
        Ok(())
    }

    pub fn upsert_skill(&self, name: &str) -> Result<i64> {
        let conn = self.inner.lock().unwrap();

        conn.execute(
            "INSERT OR IGNORE INTO Skills (skill) VALUES (?1)",
            params![name],
        )?;

        let mut stmt = conn.prepare("SELECT skill_id FROM Skills WHERE skill = ?1")?;
        let mut rows = stmt.query(params![name])?;
        if let Some(row) = rows.next()? {
            let id: i64 = row.get(0)?;
            Ok(id)
        } else {
            anyhow::bail!("Falha ao recuperar skill_id após upsert");
        }
    }

    pub fn save_job_skill(&self, job_id: i64, skill_id: i64, weight: Option<f32>) -> Result<()> {
        let conn = self.inner.lock().unwrap();
        conn.execute(
            "INSERT OR REPLACE INTO JobSkills (job_id, skill_id, weight) VALUES (?1, ?2, ?3)",
            params![job_id, skill_id, weight],
        )?;
        Ok(())
    }

    pub fn get_stats(&self) -> Result<(i64, i64)> {
        let conn = self.inner.lock().unwrap();

        let total_companies: i64 = conn.query_row(
            "SELECT COUNT(*) FROM Company",
            [],
            |row| row.get(0),
        )?;

        let total_jobs: i64 = conn.query_row(
            "SELECT COUNT(*) FROM jobs",
            [],
            |row| row.get(0),
        )?;

        Ok((total_companies, total_jobs))
    }
}
