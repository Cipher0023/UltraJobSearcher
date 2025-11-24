export async function collect({ browser, userAgent, role, pagesPerSource = 20 }) {
  const results = [];
  const context = await browser.newContext({ userAgent });
  const page = await context.newPage();

  try {
    const query = encodeURIComponent(role);
    const searchUrl = `https://boards.greenhouse.io/embed/job_board?s=${query}`;
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 60000 });

    const links = await page.$$eval(
      "a.job-link, a[href*='/jobs/']",
      (els) => els.map((e) => e.href).slice(0, 50)
    );

    for (const link of links.slice(0, pagesPerSource)) {
      try {
        await page.goto(link, { waitUntil: "domcontentloaded", timeout: 30000 });
        const job = await page.evaluate(() => {
          const title = document.querySelector("h1.app-title")?.innerText || "";
          const company = document.querySelector(".company-name")?.innerText || "";
          const location = document.querySelector(".location")?.innerText || "";
          const description = document.querySelector("#content")?.innerText || "";
          return { title, company, location, description };
        });
        results.push({ ...job, url: link, source: "greenhouse" });
        await page.waitForTimeout(500 + Math.random() * 500);
      } catch (err) {
        console.warn("Greenhouse single job error", err.message);
      }
    }
  } catch (err) {
    console.warn("Greenhouse search error", err.message);
  }

  await page.close();
  await context.close();
  return results;
}
