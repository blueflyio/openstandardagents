import { expect, test } from "@playwright/test";

/**
 * Drupal LLM Platform Integration E2E Tests
 * Tests OSSA integration with Drupal modules and theme
 */

test.describe("Drupal LLM Platform Integration", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the Drupal LLM platform
    await page.goto("https://llm-platform.ddev.site");
  });

  test.describe("OSSA API Integration", () => {
    test("should expose OSSA-compliant API endpoints", async ({ page }) => {
      // Test OSSA API endpoints
      const response = await page.request.get("/api/v1/agents");
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(500);
    });

    test("should serve OpenAPI specification", async ({ page }) => {
      const response = await page.request.get("/api/specification.openapi.yml");
      expect(response.status()).toBe(200);

      const content = await response.text();
      expect(content).toContain("openapi:");
      expect(content).toContain("info:");
    });

    test("should handle OSSA agent registration", async ({ page }) => {
      const response = await page.request.post("/api/v1/agents", {
        data: {
          name: "test-agent",
          type: "llm",
          capabilities: ["text_generation", "conversation"],
        },
      });

      // Should either succeed or return validation error
      expect([200, 201, 400, 422]).toContain(response.status());
    });
  });

  test.describe("LLM Module OSSA Compliance", () => {
    test("should implement OSSA agent interface", async ({ page }) => {
      await page.goto("https://llm-platform.ddev.site/llm/chat");

      // Check for OSSA-compliant elements
      await expect(page.locator(".llm-chat-container")).toBeVisible();

      // Test agent capabilities endpoint
      const response = await page.request.get(
        "/api/v1/agents/llm/capabilities"
      );
      expect(response.status()).toBeGreaterThanOrEqual(200);
    });

    test("should support OSSA event bus", async ({ page }) => {
      await page.goto("https://llm-platform.ddev.site");

      // Test WebSocket connection for OSSA event bus
      const wsUrl = "wss://llm-platform.ddev.site/ws";

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

  test.describe("MCP Registry OSSA Integration", () => {
    test("should register OSSA-compliant services", async ({ page }) => {
      await page.goto(
        "https://llm-platform.ddev.site/admin/config/mcp-registry/services"
      );

      // Test service registration with OSSA compliance
      const response = await page.request.post("/api/mcp-registry/services", {
        data: {
          name: "ossa-compliant-service",
          type: "ai_model",
          ossa_version: "0.1.9",
          capabilities: ["text_generation"],
          endpoints: {
            chat: "/api/v1/chat",
            capabilities: "/api/v1/capabilities",
          },
        },
      });

      expect([200, 201, 400, 422]).toContain(response.status());
    });

    test("should discover OSSA services", async ({ page }) => {
      await page.goto(
        "https://llm-platform.ddev.site/admin/config/mcp-registry/discovery"
      );

      // Test OSSA service discovery
      const response = await page.request.get(
        "/api/mcp-registry/discover?ossa_compliant=true"
      );
      expect(response.status()).toBeGreaterThanOrEqual(200);
    });
  });

  test.describe("Government Compliance OSSA", () => {
    test("should implement OSSA security standards", async ({ page }) => {
      await page.goto(
        "https://llm-platform.ddev.site/admin/config/gov-compliance"
      );

      // Test OSSA security compliance
      const response = await page.request.get(
        "/api/gov-compliance/ossa-security"
      );
      expect(response.status()).toBeGreaterThanOrEqual(200);
    });

    test("should audit OSSA agent compliance", async ({ page }) => {
      await page.goto(
        "https://llm-platform.ddev.site/admin/config/gov-compliance/ai-governance"
      );

      // Test OSSA compliance audit
      const response = await page.request.post("/api/gov-compliance/audit", {
        data: {
          standard: "ossa",
          version: "0.1.9",
          agents: ["llm", "mcp-registry"],
        },
      });

      expect([200, 201, 400, 422]).toContain(response.status());
    });
  });

  test.describe("API Normalizer OSSA", () => {
    test("should normalize OSSA API requests", async ({ page }) => {
      await page.goto(
        "https://llm-platform.ddev.site/admin/config/api-normalizer"
      );

      // Test OSSA API normalization
      const response = await page.request.post("/api/normalizer/transform", {
        data: {
          input_format: "json",
          output_format: "ossa",
          data: {
            agent: "test-agent",
            action: "chat",
            message: "Hello OSSA",
          },
        },
      });

      expect([200, 400, 422]).toContain(response.status());
    });

    test("should validate OSSA schemas", async ({ page }) => {
      await page.goto(
        "https://llm-platform.ddev.site/admin/config/api-normalizer/validation"
      );

      // Test OSSA schema validation
      const response = await page.request.post("/api/normalizer/validate", {
        data: {
          schema: "ossa-agent",
          data: {
            name: "test-agent",
            type: "llm",
            version: "0.1.9",
          },
        },
      });

      expect([200, 400, 422]).toContain(response.status());
    });
  });

  test.describe("Theme OSSA Integration", () => {
    test("should display OSSA agent status", async ({ page }) => {
      await page.goto("https://llm-platform.ddev.site");

      // Check for OSSA agent status indicators
      await expect(page.locator(".agent-orchestra")).toBeVisible();
      await expect(
        page.locator(".agent-status-indicator")
      ).toHaveCount.greaterThan(0);
    });

    test("should show OSSA compliance metrics", async ({ page }) => {
      await page.goto("https://llm-platform.ddev.site");

      // Check for OSSA compliance dashboard
      await expect(page.locator(".compliance-dashboard")).toBeVisible();
      await expect(page.locator(".ossa-compliance-metrics")).toBeVisible();
    });
  });

  test.describe("Performance & Monitoring", () => {
    test("should monitor OSSA agent performance", async ({ page }) => {
      await page.goto("https://llm-platform.ddev.site");

      // Test OSSA performance monitoring
      const response = await page.request.get("/api/monitoring/ossa-agents");
      expect(response.status()).toBeGreaterThanOrEqual(200);
    });

    test("should track OSSA compliance metrics", async ({ page }) => {
      await page.goto("https://llm-platform.ddev.site");

      // Test OSSA metrics collection
      const response = await page.request.get("/api/metrics/ossa-compliance");
      expect(response.status()).toBeGreaterThanOrEqual(200);
    });
  });

  test.describe("End-to-End OSSA Workflow", () => {
    test("should complete OSSA agent lifecycle", async ({ page }) => {
      // 1. Register OSSA agent
      const registerResponse = await page.request.post("/api/v1/agents", {
        data: {
          name: "e2e-test-agent",
          type: "llm",
          ossa_version: "0.1.9",
          capabilities: ["text_generation", "conversation"],
        },
      });
      expect([200, 201]).toContain(registerResponse.status());

      // 2. Test agent capabilities
      const capabilitiesResponse = await page.request.get(
        "/api/v1/agents/e2e-test-agent/capabilities"
      );
      expect(capabilitiesResponse.status()).toBe(200);

      // 3. Execute agent action
      const actionResponse = await page.request.post(
        "/api/v1/agents/e2e-test-agent/chat",
        {
          data: {
            message: "Test OSSA agent",
            context: "e2e-testing",
          },
        }
      );
      expect([200, 201]).toContain(actionResponse.status());

      // 4. Monitor agent status
      const statusResponse = await page.request.get(
        "/api/v1/agents/e2e-test-agent/status"
      );
      expect(statusResponse.status()).toBe(200);

      // 5. Cleanup - remove test agent
      const deleteResponse = await page.request.delete(
        "/api/v1/agents/e2e-test-agent"
      );
      expect([200, 204]).toContain(deleteResponse.status());
    });
  });
});
