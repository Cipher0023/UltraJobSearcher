export async function collect({ browser, userAgent, role, pagesPerSource = 20 }) {
  const results = [];
  const context = await browser.newContext({ userAgent });
  const page = await context.newPage();

  try {
    const query = encodeURIComponent(role);
    const searchUrl = `https://portal.gupy.io/job-search/term=${query}`;
    
    console.log(`[Gupy] Buscando: "${role}"`);
    await page.goto(searchUrl, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(4000);

    const links = await page.evaluate(() => {
      const selectors = [
        'a[href*="/job/eyJ"]',
        'a[class*="sc-"]',
        'a[data-testid*="job"]'
      ];
      
      let foundLinks = [];
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          foundLinks = Array.from(elements)
            .map(el => el.href)
            .filter(href => href && href.includes('/job/'));
          if (foundLinks.length > 0) break;
        }
      }
      return [...new Set(foundLinks)];
    });

    console.log(`[Gupy] Encontrou ${links.length} vagas`);

    for (const link of links.slice(0, pagesPerSource)) {
      try {
        await page.goto(link, { waitUntil: "networkidle", timeout: 30000 });
        await page.waitForTimeout(3000);

        const job = await page.evaluate(() => {
          const getTextContent = (selectors) => {
            for (const selector of selectors) {
              const el = document.querySelector(selector);
              if (el?.innerText?.trim()) return el.innerText.trim();
            }
            return "";
          };

          const getAllText = () => {
            const main = document.querySelector('main') || document.body;
            return main.innerText || "";
          };

          const title = getTextContent([
            'h1[class*="JobTitle"]',
            'h1[class*="job-title"]',
            'h1',
            '[data-testid="job-title"]'
          ]);

          const company = getTextContent([
            '[class*="CompanyName"]',
            '[class*="company-name"]',
            'a[class*="company"]',
            '[data-testid="company-name"]'
          ]);

          const location = getTextContent([
            '[class*="JobLocation"]',
            '[class*="location"]',
            'span[class*="city"]',
            '[data-testid="job-location"]'
          ]);

          let description = getTextContent([
            '[class*="JobDescription"]',
            '[class*="job-description"]',
            'div[class*="description"]',
            '[data-testid="job-description"]',
            'section[class*="description"]'
          ]);

          if (!description) {
            description = getAllText();
          }

          return { title, company, location, description };
        });

        if (job.title || job.description) {
          results.push({ ...job, url: link, source: "gupy" });
        }
        
        await page.waitForTimeout(1000 + Math.random() * 1000);
      } catch (err) {
        console.warn(`[Gupy] Erro ao processar vaga: ${err.message}`);
      }
    }
  } catch (err) {
    console.warn(`[Gupy] Erro na busca: ${err.message}`);
  }

  await page.close();
  await context.close();
  
  console.log(`[Gupy] Coletou ${results.length} vagas`);
  return results;
}
