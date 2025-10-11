import { chromium, FullConfig } from "@playwright/test";

async function globalSetup(config: FullConfig) {
  console.log("🚀 Starting OSSA E2E Global Setup");

  // Start browser for setup tasks
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Wait for the OSSA server to be ready
    const baseURL = config.projects[0]?.use?.baseURL || "http://localhost:3001";
    console.log(`⏳ Waiting for OSSA server at ${baseURL}`);

    // Try to connect to the server with retries
    let retries = 30;
    while (retries > 0) {
      try {
        await page.goto(baseURL, { timeout: 5000 });
        console.log("✅ OSSA server is ready");
        break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          throw new Error(`OSSA server not ready after 30 attempts: ${error}`);
        }
        console.log(
          `⏳ Server not ready, retrying... (${retries} attempts left)`
        );
        await page.waitForTimeout(1000);
      }
    }

    // Verify API endpoints are working
    const healthResponse = await page.request.get(`${baseURL}/health`);
    if (!healthResponse.ok()) {
      throw new Error(`Health check failed: ${healthResponse.status()}`);
    }

    console.log("✅ OSSA E2E Global Setup completed successfully");
  } catch (error) {
    console.error("❌ OSSA E2E Global Setup failed:", error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
