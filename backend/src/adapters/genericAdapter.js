export async function collect({
  browser,
  userAgent,
  role,
  pagesPerSource = 20,
  src,
}) {
  const results = [];
  const context = await browser.newContext({ userAgent });
  const page = await context.newPage();

  try {
    await page.goto(src.host, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    const job = await page.evaluate(() => {
      const title = document.querySelector("h1")?.innerText || "";
      const company =
        document.querySelector("[class*='company']")?.innerText || "";
      const location =
        document.querySelector("[class*='location']")?.innerText || "";
      const description =
        document.querySelector("[class*='description']")?.innerText ||
        document.querySelector("main")?.innerText ||
        "";
      return { title, company, location, description };
    });

    if (job.title || job.description) {
      results.push({ ...job, url: src.host, source: "generic" });
    }
  } catch (err) {
    console.warn("Generic adapter error", err.message);
  }

  await page.close();
  await context.close();
  return results;
}
