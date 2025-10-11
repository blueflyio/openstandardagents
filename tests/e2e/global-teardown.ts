import { FullConfig } from "@playwright/test";

async function globalTeardown(config: FullConfig) {
  console.log("🧹 Starting OSSA E2E Global Teardown");

  try {
    // Clean up any global resources
    console.log("✅ OSSA E2E Global Teardown completed successfully");
  } catch (error) {
    console.error("❌ OSSA E2E Global Teardown failed:", error);
    // Don't throw error in teardown to avoid masking test failures
  }
}

export default globalTeardown;
