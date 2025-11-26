mod db;
mod crawler;
mod ui;

use anyhow::Result;
use crate::crawler::LinkedInCrawler;
use crate::db::Database;
use crate::ui::CliApp;

#[tokio::main]
async fn main() -> Result<()> {
    // Inicializa DB e crawler
    let db = Database::new("jobs.db")?;
    let crawler = LinkedInCrawler::new(db.clone())?;

    // Inicializa interface de linha de comando básica
    let mut app = CliApp::new(crawler, db);
    app.run().await?;

    Ok(())
}
