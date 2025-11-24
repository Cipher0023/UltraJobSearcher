export async function collect({ browser, userAgent, role, pagesPerSource = 20 }) {
  const results = [];
  const context = await browser.newContext({ userAgent });
  const page = await context.newPage();

  try {
    const query = role.toLowerCase().replace(/\s+/g, '-');
    const searchUrl = `https://www.vagas.com.br/vagas-de-${query}`;
    
    console.log(`[Vagas.com] Buscando: "${role}"`);
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(2000);

    const links = await page.evaluate(() => {
      const elements = document.querySelectorAll('a.link-detalhes-vaga');
      return Array.from(elements).map(el => el.href).filter(href => href);
    });

    console.log(`[Vagas.com] Encontrou ${links.length} vagas`);

    for (const link of links.slice(0, pagesPerSource)) {
      try {
        await page.goto(link, { waitUntil: "domcontentloaded", timeout: 30000 });
        await page.waitForTimeout(1500);

        const job = await page.evaluate(() => {
          const getTextContent = (selectors) => {
            for (const selector of selectors) {
              const el = document.querySelector(selector);
              if (el?.innerText?.trim()) return el.innerText.trim();
            }
            return "";
          };

          const title = getTextContent([
            'h1.job-shortdescription__title',
            'h1'
          ]);

          const company = getTextContent([
            '.job-shortdescription__company',
            'span[itemprop="name"]'
          ]);

          const location = getTextContent([
            '.job-location__city',
            'span[itemprop="addressLocality"]'
          ]);

          const description = getTextContent([
            '.job-description__text',
            '#job-description'
          ]);

          return { title, company, location, description };
        });

        if (job.title || job.description) {
          results.push({ ...job, url: link, source: "vagas" });
        }
        
        await page.waitForTimeout(800 + Math.random() * 500);
      } catch (err) {
        console.warn(`[Vagas.com] Erro ao processar vaga: ${err.message}`);
      }
    }
  } catch (err) {
    console.warn(`[Vagas.com] Erro na busca: ${err.message}`);
  }

  await page.close();
  await context.close();
  
  console.log(`[Vagas.com] Coletou ${results.length} vagas`);
  return results;
}
