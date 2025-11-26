use crate::db::{Company, Database, JobListing};
use anyhow::Result;
use rand::Rng;
use reqwest::header::{HeaderMap, HeaderValue, ACCEPT, ACCEPT_LANGUAGE, USER_AGENT};
use scraper::{Html, Selector};
use std::time::Duration;
use tokio::time::sleep;

pub struct LinkedInCrawler {
    client: reqwest::Client,
    pub db: Database,
}

impl LinkedInCrawler {
    pub fn new(db: Database) -> Result<Self> {
        let mut headers = HeaderMap::new();
        headers.insert(ACCEPT, HeaderValue::from_static("text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"));
        headers.insert(ACCEPT_LANGUAGE, HeaderValue::from_static("en-US,en;q=0.5"));
        
        let client = reqwest::Client::builder()
            .default_headers(headers)
            .cookie_store(true)
            .timeout(Duration::from_secs(30))
            .build()?;

        Ok(Self { client, db })
    }

    fn get_random_user_agent(&self) -> String {
        let agents = vec![
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
        ];
        
        let mut rng = rand::thread_rng();
        agents[rng.gen_range(0..agents.len())].to_string()
    }

    async fn random_delay(&self) {
        let mut rng = rand::thread_rng();
        let delay = rng.gen_range(2..8);
        sleep(Duration::from_secs(delay)).await;
    }

    /// Busca vagas para uma empresa específica usando a busca pública de vagas.
    pub async fn search_jobs_for_company(&self, company: &str) -> Result<Vec<JobListing>> {
        let encoded_company = urlencoding::encode(company);
        let url = format!(
            "https://www.linkedin.com/jobs/search?keywords={}&location=Brazil&trk=public_jobs_jobs-search-bar_search-submit",
            encoded_company
        );

        println!("Buscando vagas para: {}", company);
        
        self.random_delay().await;

        let response = self.client
            .get(&url)
            .header(USER_AGENT, self.get_random_user_agent())
            .send()
            .await?;

        if !response.status().is_success() {
            println!("Erro na requisição: {}", response.status());
            return Ok(vec![]);
        }

        let html = response.text().await?;

        let jobs = self.parse_job_listings(&html, company);

        for job in &jobs {
            // Garante que a empresa da vaga existe/é atualizada
            let company_name = job.company_name.clone();
            let company_model = Company {
                company_id: None,
                name: company_name,
                country: None,
                website: None,
                linkedin_url: None,
            };
            let company_id = self.db.upsert_company(&company_model)?;

            // Cria uma cópia com o company_id resolvido e persiste
            let mut job_to_save = job.clone();
            job_to_save.company_id = company_id;
            self.db.save_job(&job_to_save)?;
        }

        println!("Encontradas {} vagas para {}", jobs.len(), company);
        Ok(jobs)
    }

    fn parse_job_listings(&self, html: &str, _company: &str) -> Vec<JobListing> {
        let document = Html::parse_document(html);
        let mut jobs = Vec::new();

        let job_card_selector = Selector::parse("div.base-card").unwrap();
        let title_selector = Selector::parse("h3.base-search-card__title").unwrap();
        let company_selector = Selector::parse("h4.base-search-card__subtitle").unwrap();
        let location_selector = Selector::parse("span.job-search-card__location").unwrap();
        let link_selector = Selector::parse("a.base-card__full-link").unwrap();
        let time_selector = Selector::parse("time").unwrap();

        for card in document.select(&job_card_selector) {
            let title = card
                .select(&title_selector)
                .next()
                .map(|el| el.text().collect::<String>().trim().to_string())
                .unwrap_or_default();

            let company_name = card
                .select(&company_selector)
                .next()
                .map(|el| el.text().collect::<String>().trim().to_string())
                .unwrap_or_else(|| "Desconhecida".to_string());

            let location = card
                .select(&location_selector)
                .next()
                .map(|el| el.text().collect::<String>().trim().to_string())
                .unwrap_or_default();

            let url = card
                .select(&link_selector)
                .next()
                .and_then(|el| el.value().attr("href"))
                .map(|s| s.to_string())
                .unwrap_or_default();

            let posted_at = card
                .select(&time_selector)
                .next()
                .and_then(|el| el.value().attr("datetime"))
                .map(|s| s.to_string());

            if !title.is_empty() && !url.is_empty() {
                jobs.push(JobListing {
                    job_id: None,
                    company_id: 0, // será preenchido depois em search_jobs_for_company
                    job_title: title,
                    place: if location.is_empty() { None } else { Some(location) },
                    description: None,
                    url,
                    source: "linkedin".to_string(),
                    posted_at,
                    company_name,
                });
            }
        }

        jobs
    }

    /// Placeholder para uma futura estratégia mais ampla de descoberta de empresas.
    /// Descobrir "todas" as empresas do LinkedIn via scraping puro é algo massivo e sujeito
    /// a bloqueios pesados. Vamos tratar isso incrementalmente depois, com paginação,
    /// seeds e limites.
    pub async fn discover_companies_incremental(&self) -> Result<()> {
        println!("[TODO] Implementar estratégia incremental de descoberta de empresas.");
        Ok(())
    }
}
