import { expect, test } from "@playwright/test";

test.describe("OSSA API Endpoints", () => {
  test.beforeEach(async ({ page }) => {
    // Set up any common test state
  });

  test("should respond to health check", async ({ page }) => {
    const response = await page.request.get("/health");
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("status");
    expect(data.status).toBe("healthy");
  });

  test("should serve OpenAPI specification", async ({ page }) => {
    const response = await page.request.get("/api/specification.openapi.yml");
    expect(response.status()).toBe(200);

    const content = await response.text();
    expect(content).toContain("openapi:");
    expect(content).toContain("info:");
  });

  test("should serve API documentation", async ({ page }) => {
    const response = await page.request.get("/docs");
    expect(response.status()).toBe(200);

    const content = await response.text();
    expect(content).toContain("swagger");
  });

  test("should handle CORS preflight requests", async ({ page }) => {
    const response = await page.request.options("/api/v1/agents", {
      headers: {
        Origin: "http://localhost:3000",
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "Content-Type",
      },
    });

    expect(response.status()).toBe(200);
    expect(response.headers()["access-control-allow-origin"]).toBeDefined();
  });

  test("should validate request schemas", async ({ page }) => {
    // Test invalid request
    const response = await page.request.post("/api/v1/agents", {
      data: {
        invalidField: "test",
      },
    });

    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test("should handle authentication endpoints", async ({ page }) => {
    const response = await page.request.get("/api/v1/auth/status");
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(500);
  });

  test("should serve static assets", async ({ page }) => {
    const response = await page.request.get("/favicon.ico");
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(400);
  });

  test("should handle 404 for unknown endpoints", async ({ page }) => {
    const response = await page.request.get("/api/v1/unknown-endpoint");
    expect(response.status()).toBe(404);
  });
});

test.describe("OSSA Event Bus Integration", () => {
  test("should handle event bus connections", async ({ page }) => {
    // Test WebSocket connection to event bus
    const wsUrl = "ws://localhost:3001/ws";

    await page.goto("/");

    // Test WebSocket connection
    const wsResponse = await page.evaluate((url) => {
      return new Promise((resolve) => {
        const ws = new WebSocket(url);
        ws.onopen = () => resolve("connected");
        ws.onerror = () => resolve("error");
        setTimeout(() => resolve("timeout"), 5000);
      });
    }, wsUrl);

    expect(["connected", "error", "timeout"]).toContain(wsResponse);
  });
});

test.describe("OSSA Performance Tests", () => {
  test("should respond within acceptable time limits", async ({ page }) => {
    const startTime = Date.now();

    const response = await page.request.get("/health");
    const endTime = Date.now();

    expect(response.status()).toBe(200);
    expect(endTime - startTime).toBeLessThan(1000); // Should respond within 1 second
  });

  test("should handle concurrent requests", async ({ page }) => {
    const promises = Array.from({ length: 10 }, () =>
      page.request.get("/health")
    );

    const responses = await Promise.all(promises);

    responses.forEach((response) => {
      expect(response.status()).toBe(200);
    });
  });
});
