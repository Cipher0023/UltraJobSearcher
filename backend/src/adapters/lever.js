export async function collect({ browser, userAgent, role, pagesPerSource = 20 }) {
  const results = [];
  const context = await browser.newContext({ userAgent });
  const page = await context.newPage();

  try {
    const query = encodeURIComponent(role);
    const searchUrl = `https://jobs.lever.co/search?query=${query}`;
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 60000 });

    const links = await page.$$eval(
      "a.posting-title, a[href*='/jobs/']",
      (els) => els.map((e) => e.href).slice(0, 50)
    );

    for (const link of links.slice(0, pagesPerSource)) {
      try {
        await page.goto(link, { waitUntil: "domcontentloaded", timeout: 30000 });
        const job = await page.evaluate(() => {
          const title = document.querySelector("h2.posting-headline")?.innerText || "";
          const company = document.querySelector(".main-header-text")?.innerText || "";
          const location = document.querySelector(".location")?.innerText || "";
          const description = document.querySelector(".content")?.innerText || "";
          return { title, company, location, description };
        });
        results.push({ ...job, url: link, source: "lever" });
        await page.waitForTimeout(500 + Math.random() * 500);
      } catch (err) {
        console.warn("Lever single job error", err.message);
      }
    }
  } catch (err) {
    console.warn("Lever search error", err.message);
  }

  await page.close();
  await context.close();
  return results;
}
