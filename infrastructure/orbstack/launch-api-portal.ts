/**
 * Converted from launch-api-portal.sh
 * Auto-generated TypeScript equivalent of shell script
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

export async function main() {
  try {
    // !/bin/bash
    // Launch OpenAPI Documentation Portal with OrbStack/Docker
    // Provides comprehensive API documentation for all LLM projects

    execSync("set -e", { stdio: 'inherit' });

    console.log("🚀 Launching OpenAPI Documentation Portal");
    console.log("=========================================");
    console.log("");

    // Color codes
    const GREEN = "\\033[0;32m";
    const YELLOW = "\\033[1;33m";
    const BLUE = "\\033[0;34m";
    const RED = "\\033[0;31m";
    execSync("NC='\\033[0m' # No Color", { stdio: 'inherit' });

    // Configuration
    const COMPOSE_FILE = "../docker/docker-compose.yml";
    const PROJECT_NAME = "ossa";

    // Change to script directory
    process.chdir("$(dirname $0)");

    // Check Docker/OrbStack
    execSync("if ! docker info >/dev/null 2>&1; then", { stdio: 'inherit' });
    console.log("-e ${RED}❌ Docker/OrbStack is not running${NC}");
    console.log("Please start OrbStack and try again");
    execSync("exit 1", { stdio: 'inherit' });
    execSync("fi", { stdio: 'inherit' });

    console.log("-e ${BLUE}📦 Starting services...${NC}");

    // Start services
    execSync("docker-compose -f \"$COMPOSE_FILE\" -p \"$PROJECT_NAME\" up -d", { stdio: 'inherit' });

    // Wait for services to be ready
    console.log("-e ${YELLOW}⏳ Waiting for services to start...${NC}");
    execSync("sleep 5", { stdio: 'inherit' });

    // Check service status
    console.log("-e ${BLUE}📊 Service Status:${NC}");
    execSync("docker-compose -f \"$COMPOSE_FILE\" -p \"$PROJECT_NAME\" ps", { stdio: 'inherit' });

    // Display access URLs
    console.log("");
    console.log("-e ${GREEN}✅ OpenAPI Documentation Portal is ready!${NC}");
    console.log("");
    console.log("-e ${BLUE}🌐 Access your API documentation:${NC}");
    console.log("");
    console.log("  📘 Swagger UI (Interactive):");
    console.log("     http://localhost:8080");
    console.log("");
    console.log("  📕 Redocly (Beautiful Docs):");
    console.log("     http://localhost:8081");
    console.log("");
    console.log("  🌐 API Portal (All Projects):");
    console.log("     http://localhost:8082");
    console.log("");
    console.log("  🔧 Mock API Server:");
    console.log("     http://localhost:4010");
    console.log("");
    console.log("  🛡️ API Validation Proxy:");
    console.log("     http://localhost:4011");
    console.log("");
    console.log("-e ${YELLOW}📋 Available APIs:${NC}");
    console.log("  • OSSA Specification API");
    console.log("  • Orchestration API");
    console.log("  • Clean Architecture API");
    console.log("  • MCP Infrastructure");
    console.log("  • Voice Agent API");
    console.log("");
    console.log("-e ${CYAN}💡 Tips:${NC}");
    console.log("  • Switch between APIs using the dropdown in Swagger UI");
    console.log("  • Test endpoints directly from the documentation");
    console.log("  • Use the mock server for development without a backend");
    console.log("");
    console.log("-e ${YELLOW}To stop services:${NC}");
    console.log("  docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME down");
    console.log("");
    console.log(chalk.green("✅ Script completed successfully"));
  } catch (error) {
    console.error(chalk.red("❌ Script failed:"), error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}