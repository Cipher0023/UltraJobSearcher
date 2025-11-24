export async function collect({ browser, userAgent, role, pagesPerSource = 20 }) {
  const results = [];
  const context = await browser.newContext({ userAgent });
  const page = await context.newPage();

  try {
    const query = encodeURIComponent(role);
    const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${query}&location=Brazil`;
    
    console.log(`[LinkedIn] Buscando: "${role}"`);
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(3000);

    const links = await page.evaluate(() => {
      const selectors = [
        'a.base-card__full-link',
        'a[href*="/jobs/view/"]',
        '.job-card-container__link',
        '.base-search-card__title'
      ];
      
      let foundLinks = [];
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          foundLinks = Array.from(elements).map(el => el.href).filter(href => href);
          if (foundLinks.length > 0) break;
        }
      }
      return [...new Set(foundLinks)];
    });

    console.log(`[LinkedIn] Encontrou ${links.length} vagas`);

    for (const link of links.slice(0, pagesPerSource)) {
      try {
        await page.goto(link, { waitUntil: "domcontentloaded", timeout: 30000 });
        await page.waitForTimeout(2000);

        const job = await page.evaluate(() => {
          const getTextContent = (selectors) => {
            for (const selector of selectors) {
              const el = document.querySelector(selector);
              if (el?.innerText?.trim()) return el.innerText.trim();
            }
            return "";
          };

          const title = getTextContent([
            'h1.top-card-layout__title',
            'h1.topcard__title',
            'h1',
            '.job-details-jobs-unified-top-card__job-title'
          ]);

          const company = getTextContent([
            'a.topcard__org-name-link',
            '.topcard__flavor',
            '.job-details-jobs-unified-top-card__company-name',
            'a[data-tracking-control-name="public_jobs_topcard-org-name"]'
          ]);

          const location = getTextContent([
            '.topcard__flavor--bullet',
            '.job-details-jobs-unified-top-card__bullet',
            'span.topcard__flavor--bullet'
          ]);

          const description = getTextContent([
            '.show-more-less-html__markup',
            '.description__text',
            '#job-details',
            '.jobs-description__content'
          ]);

          return { title, company, location, description };
        });

        if (job.title || job.description) {
          results.push({ ...job, url: link, source: "linkedin" });
        }
        
        await page.waitForTimeout(1000 + Math.random() * 1000);
      } catch (err) {
        console.warn(`[LinkedIn] Erro ao processar vaga: ${err.message}`);
      }
    }
  } catch (err) {
    console.warn(`[LinkedIn] Erro na busca: ${err.message}`);
  }

  await page.close();
  await context.close();
  
  console.log(`[LinkedIn] Coletou ${results.length} vagas`);
  return results;
}
