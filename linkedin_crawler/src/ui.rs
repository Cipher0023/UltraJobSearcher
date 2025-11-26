use crate::crawler::LinkedInCrawler;
use crate::db::Database;
use anyhow::Result;
use std::io::{self, Write};

pub struct CliApp {
    crawler: LinkedInCrawler,
    db: Database,
}

impl CliApp {
    pub fn new(crawler: LinkedInCrawler, db: Database) -> Self {
        Self { crawler, db }
    }

    pub async fn run(&mut self) -> Result<()> {
        loop {
            println!("");
            println!("============================");
            println!(" UltraJob LinkedIn Crawler ");
            println!("============================");
            println!("1) Buscar vagas para empresa específica");
            println!("2) Descobrir novas empresas (incremental)");
            println!("3) Mostrar estatísticas atuais");
            println!("0) Sair");
            print!("\nEscolha uma opção: ");
            io::stdout().flush().unwrap();

            let mut input = String::new();
            io::stdin().read_line(&mut input)?;
            let choice = input.trim();

            match choice {
                "1" => {
                    self.option_search_company().await?;
                }
                "2" => {
                    // Usa o método placeholder para remover o warning e preparar a funcionalidade
                    self.crawler.discover_companies_incremental().await?;
                }
                "3" => {
                    self.option_show_stats()?;
                }
                "0" => {
                    println!("Saindo...");
                    break;
                }
                _ => {
                    println!("Opção inválida.");
                }
            }
        }

        Ok(())
    }

    fn option_show_stats(&self) -> Result<()> {
        let (total_companies, total_jobs) = self.db.get_stats()?;

        println!("\nEstatísticas atuais:");
        println!("- Empresas cadastradas: {}", total_companies);
        println!("- Vagas cadastradas: {}", total_jobs);

        Ok(())
    }

    async fn option_search_company(&self) -> Result<()> {
        print!("\nNome da empresa: ");
        io::stdout().flush().unwrap();

        let mut company = String::new();
        io::stdin().read_line(&mut company)?;
        let company = company.trim();

        if company.is_empty() {
            println!("Nome da empresa não pode ser vazio.");
            return Ok(());
        }

        let jobs = self.crawler.search_jobs_for_company(company).await?;

        for job in jobs {
            println!("- {} | {}", job.job_title, job.place.as_deref().unwrap_or("Local não informado"));
        }

        Ok(())
    }
}
