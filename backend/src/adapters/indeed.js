export async function collect({ browser, userAgent, role, pagesPerSource = 20 }) {
  const results = [];
  const context = await browser.newContext({ userAgent });
  const page = await context.newPage();

  try {
    const query = encodeURIComponent(role);
    const searchUrl = `https://br.indeed.com/jobs?q=${query}&l=Brasil`;
    
    console.log(`[Indeed] Buscando: "${role}"`);
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(3000);

    const links = await page.evaluate(() => {
      const selectors = [
        'a.jcs-JobTitle',
        'h2.jobTitle a',
        'a[data-jk]',
        'a[id*="job_"]'
      ];
      
      let foundLinks = [];
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          foundLinks = Array.from(elements)
            .map(el => {
              const href = el.href;
              if (href && href.includes('indeed.com')) return href;
              if (href && href.startsWith('/')) return `https://br.indeed.com${href}`;
              return null;
            })
            .filter(href => href);
          if (foundLinks.length > 0) break;
        }
      }
      return [...new Set(foundLinks)];
    });

    console.log(`[Indeed] Encontrou ${links.length} vagas`);

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
            'h1.jobsearch-JobInfoHeader-title',
            'h1[class*="jobTitle"]',
            'h1',
            '[data-testid="jobsearch-JobInfoHeader-title"]'
          ]);

          const company = getTextContent([
            '[data-company-name="true"]',
            '[data-testid="inlineHeader-companyName"]',
            'div[data-testid="inlineHeader-companyName"] a',
            '[class*="companyName"]'
          ]);

          const location = getTextContent([
            '[data-testid="job-location"]',
            '[data-testid="inlineHeader-companyLocation"]',
            'div[class*="location"]'
          ]);

          const description = getTextContent([
            '#jobDescriptionText',
            '[id="jobDescriptionText"]',
            'div[class*="jobsearch-jobDescriptionText"]',
            '[data-testid="jobDescriptionText"]'
          ]);

          return { title, company, location, description };
        });

        if (job.title || job.description) {
          results.push({ ...job, url: link, source: "indeed" });
        }
        
        await page.waitForTimeout(1000 + Math.random() * 1000);
      } catch (err) {
        console.warn(`[Indeed] Erro ao processar vaga: ${err.message}`);
      }
    }
  } catch (err) {
    console.warn(`[Indeed] Erro na busca: ${err.message}`);
  }

  await page.close();
  await context.close();
  
  console.log(`[Indeed] Coletou ${results.length} vagas`);
  return results;
}
