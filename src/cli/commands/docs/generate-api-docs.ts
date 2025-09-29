/**
 * Converted from generate-api-docs.sh
 * Auto-generated TypeScript equivalent of shell script
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

export async function main() {
  try {
    // !/bin/bash
    // OSSA API Documentation Generator
    // Generates beautiful API documentation from OpenAPI specs

    execSync("set -e", { stdio: 'inherit' });

    console.log("🚀 OSSA API Documentation Generator");
    console.log("====================================");
    console.log("");

    // Color codes
    const GREEN = "\\033[0;32m";
    const YELLOW = "\\033[1;33m";
    const BLUE = "\\033[0;34m";
    const RED = "\\033[0;31m";
    execSync("NC='\\033[0m' # No Color", { stdio: 'inherit' });

    const OSSA_DIR = "/Users/flux423/Sites/LLM/OSSA";
    const API_DOCS_DIR = "$OSSA_DIR/docs/api/generated";
    const PUBLIC_API_DIR = "$OSSA_DIR/public/docs/api";

    // Create output directories
    console.log("-e ${BLUE}📁 Creating output directories...${NC}");
    fs.mkdirSync("$API_DOCS_DIR", { recursive: true });
    fs.mkdirSync("$PUBLIC_API_DIR", { recursive: true });

    // Function to generate documentation
    // Function: generate_docs
    execSync("local spec_file=$1", { stdio: 'inherit' });
    execSync("local output_name=$2", { stdio: 'inherit' });

    execSync("if [ -f \"$spec_file\" ]; then", { stdio: 'inherit' });
    console.log("-e ${BLUE}📝 Generating docs for: $output_name${NC}");

    // Use npx to run redocly without installation
    execSync("if npx @redocly/cli build-docs \"$spec_file\" \\", { stdio: 'inherit' });
    execSync("--output \"$API_DOCS_DIR/${output_name}.html\" 2>/dev/null; then", { stdio: 'inherit' });
    console.log("-e   ${GREEN}✅ Generated: ${output_name}.html${NC}");

    // Copy to public directory for GitLab Pages
    execSync("cp \"$API_DOCS_DIR/${output_name}.html\" \"$PUBLIC_API_DIR/${output_name}.html\"", { stdio: 'inherit' });

    // Generate JSON bundle
    execSync("npx @redocly/cli bundle \"$spec_file\" \\", { stdio: 'inherit' });
    execSync("--output \"$API_DOCS_DIR/${output_name}.json\" \\", { stdio: 'inherit' });
    execSync("--ext json 2>/dev/null || true", { stdio: 'inherit' });

    execSync("return 0", { stdio: 'inherit' });
    execSync("else", { stdio: 'inherit' });
    console.log("-e   ${RED}❌ Failed to generate docs for: $output_name${NC}");
    execSync("return 1", { stdio: 'inherit' });
    execSync("fi", { stdio: 'inherit' });
    execSync("else", { stdio: 'inherit' });
    console.log("-e ${YELLOW}⚠️  Spec file not found: $spec_file${NC}");
    execSync("return 1", { stdio: 'inherit' });
    execSync("fi", { stdio: 'inherit' });
    execSync("}", { stdio: 'inherit' });

    // Find and process OpenAPI specifications
    console.log("-e ${BLUE}🔍 Finding OpenAPI specifications...${NC}");

    const SPECS_FOUND = "0";
    const DOCS_GENERATED = "0";

    // Check main API directory
    execSync("if [ -d \"$OSSA_DIR/src/api\" ]; then", { stdio: 'inherit' });
    execSync("for spec in \"$OSSA_DIR/src/api\"/*.yml \"$OSSA_DIR/src/api\"/*.yaml; do", { stdio: 'inherit' });
    execSync("if [ -f \"$spec\" ]; then", { stdio: 'inherit' });
    execSync("SPECS_FOUND=$((SPECS_FOUND + 1))", { stdio: 'inherit' });
    execSync("NAME=$(basename \"$spec\" | sed 's/\\.\\(yml\\|yaml\\)$//')", { stdio: 'inherit' });
    execSync("generate_docs \"$spec\" \"$NAME\" && DOCS_GENERATED=$((DOCS_GENERATED + 1))", { stdio: 'inherit' });
    execSync("fi", { stdio: 'inherit' });
    execSync("done", { stdio: 'inherit' });
    execSync("fi", { stdio: 'inherit' });

    // Check docs/api directory
    execSync("if [ -d \"$OSSA_DIR/docs/api\" ]; then", { stdio: 'inherit' });
    execSync("for spec in \"$OSSA_DIR/docs/api\"/*.yml \"$OSSA_DIR/docs/api\"/*.yaml; do", { stdio: 'inherit' });
    execSync("if [ -f \"$spec\" ]; then", { stdio: 'inherit' });
    execSync("SPECS_FOUND=$((SPECS_FOUND + 1))", { stdio: 'inherit' });
    execSync("NAME=$(basename \"$spec\" | sed 's/\\.\\(yml\\|yaml\\)$//')", { stdio: 'inherit' });
    execSync("generate_docs \"$spec\" \"$NAME\" && DOCS_GENERATED=$((DOCS_GENERATED + 1))", { stdio: 'inherit' });
    execSync("fi", { stdio: 'inherit' });
    execSync("done", { stdio: 'inherit' });
    execSync("fi", { stdio: 'inherit' });

    // Generate master index
    console.log("-e ${BLUE}📚 Generating master API index...${NC}");

    execSync("cat > \"$API_DOCS_DIR/index.html\" <<'EOF'", { stdio: 'inherit' });
    execSync("<!DOCTYPE html>", { stdio: 'inherit' });
    execSync("<html lang=\"en\">", { stdio: 'inherit' });
    execSync("<head>", { stdio: 'inherit' });
    execSync("<meta charset=\"UTF-8\">", { stdio: 'inherit' });
    execSync("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">", { stdio: 'inherit' });
    execSync("<title>OSSA API Documentation Portal</title>", { stdio: 'inherit' });
    execSync("<style>", { stdio: 'inherit' });
    execSync(":root {", { stdio: 'inherit' });
    execSync("--primary: #2563eb;", { stdio: 'inherit' });
    execSync("--primary-dark: #1e40af;", { stdio: 'inherit' });
    execSync("--secondary: #64748b;", { stdio: 'inherit' });
    execSync("--background: #f8fafc;", { stdio: 'inherit' });
    execSync("--card-bg: white;", { stdio: 'inherit' });
    execSync("--border: #e2e8f0;", { stdio: 'inherit' });
    execSync("}", { stdio: 'inherit' });

    execSync("* { margin: 0; padding: 0; box-sizing: border-box; }", { stdio: 'inherit' });

    execSync("body {", { stdio: 'inherit' });
    execSync("font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;", { stdio: 'inherit' });
    execSync("background: var(--background);", { stdio: 'inherit' });
    execSync("color: #1e293b;", { stdio: 'inherit' });
    execSync("line-height: 1.6;", { stdio: 'inherit' });
    execSync("}", { stdio: 'inherit' });

    execSync(".container {", { stdio: 'inherit' });
    execSync("max-width: 1200px;", { stdio: 'inherit' });
    execSync("margin: 0 auto;", { stdio: 'inherit' });
    execSync("padding: 2rem;", { stdio: 'inherit' });
    execSync("}", { stdio: 'inherit' });

    execSync("header {", { stdio: 'inherit' });
    execSync("background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);", { stdio: 'inherit' });
    execSync("color: white;", { stdio: 'inherit' });
    execSync("padding: 3rem 0;", { stdio: 'inherit' });
    execSync("margin-bottom: 3rem;", { stdio: 'inherit' });
    execSync("box-shadow: 0 4px 6px rgba(0,0,0,0.1);", { stdio: 'inherit' });
    execSync("}", { stdio: 'inherit' });

    execSync("h1 {", { stdio: 'inherit' });
    execSync("font-size: 2.5rem;", { stdio: 'inherit' });
    execSync("font-weight: 700;", { stdio: 'inherit' });
    execSync("margin-bottom: 0.5rem;", { stdio: 'inherit' });
    execSync("}", { stdio: 'inherit' });

    execSync(".tagline {", { stdio: 'inherit' });
    execSync("font-size: 1.125rem;", { stdio: 'inherit' });
    execSync("opacity: 0.9;", { stdio: 'inherit' });
    execSync("}", { stdio: 'inherit' });

    execSync(".stats {", { stdio: 'inherit' });
    execSync("display: grid;", { stdio: 'inherit' });
    execSync("grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));", { stdio: 'inherit' });
    execSync("gap: 1.5rem;", { stdio: 'inherit' });
    execSync("margin-bottom: 3rem;", { stdio: 'inherit' });
    execSync("}", { stdio: 'inherit' });

    execSync(".stat-card {", { stdio: 'inherit' });
    execSync("background: var(--card-bg);", { stdio: 'inherit' });
    execSync("padding: 1.5rem;", { stdio: 'inherit' });
    execSync("border-radius: 12px;", { stdio: 'inherit' });
    execSync("box-shadow: 0 1px 3px rgba(0,0,0,0.1);", { stdio: 'inherit' });
    execSync("text-align: center;", { stdio: 'inherit' });
    execSync("}", { stdio: 'inherit' });

    execSync(".stat-value {", { stdio: 'inherit' });
    execSync("font-size: 2.5rem;", { stdio: 'inherit' });
    execSync("font-weight: 700;", { stdio: 'inherit' });
    execSync("color: var(--primary);", { stdio: 'inherit' });
    execSync("margin-bottom: 0.5rem;", { stdio: 'inherit' });
    execSync("}", { stdio: 'inherit' });

    execSync(".stat-label {", { stdio: 'inherit' });
    execSync("color: var(--secondary);", { stdio: 'inherit' });
    execSync("font-size: 0.875rem;", { stdio: 'inherit' });
    execSync("text-transform: uppercase;", { stdio: 'inherit' });
    execSync("letter-spacing: 0.05em;", { stdio: 'inherit' });
    execSync("}", { stdio: 'inherit' });

    execSync(".api-grid {", { stdio: 'inherit' });
    execSync("display: grid;", { stdio: 'inherit' });
    execSync("gap: 1.5rem;", { stdio: 'inherit' });
    execSync("}", { stdio: 'inherit' });

    execSync(".api-card {", { stdio: 'inherit' });
    execSync("background: var(--card-bg);", { stdio: 'inherit' });
    execSync("border-radius: 12px;", { stdio: 'inherit' });
    execSync("padding: 1.5rem;", { stdio: 'inherit' });
    execSync("box-shadow: 0 1px 3px rgba(0,0,0,0.1);", { stdio: 'inherit' });
    execSync("transition: transform 0.2s, box-shadow 0.2s;", { stdio: 'inherit' });
    execSync("}", { stdio: 'inherit' });

    execSync(".api-card:hover {", { stdio: 'inherit' });
    execSync("transform: translateY(-2px);", { stdio: 'inherit' });
    execSync("box-shadow: 0 4px 12px rgba(0,0,0,0.15);", { stdio: 'inherit' });
    execSync("}", { stdio: 'inherit' });

    execSync(".api-card h2 {", { stdio: 'inherit' });
    execSync("color: #1e293b;", { stdio: 'inherit' });
    execSync("font-size: 1.25rem;", { stdio: 'inherit' });
    execSync("margin-bottom: 0.5rem;", { stdio: 'inherit' });
    execSync("}", { stdio: 'inherit' });

    execSync(".api-description {", { stdio: 'inherit' });
    execSync("color: var(--secondary);", { stdio: 'inherit' });
    execSync("margin-bottom: 1rem;", { stdio: 'inherit' });
    execSync("font-size: 0.875rem;", { stdio: 'inherit' });
    execSync("}", { stdio: 'inherit' });

    execSync(".api-links {", { stdio: 'inherit' });
    execSync("display: flex;", { stdio: 'inherit' });
    execSync("gap: 0.5rem;", { stdio: 'inherit' });
    execSync("flex-wrap: wrap;", { stdio: 'inherit' });
    execSync("}", { stdio: 'inherit' });

    execSync(".api-link {", { stdio: 'inherit' });
    execSync("display: inline-block;", { stdio: 'inherit' });
    execSync("padding: 0.5rem 1rem;", { stdio: 'inherit' });
    execSync("background: var(--primary);", { stdio: 'inherit' });
    execSync("color: white;", { stdio: 'inherit' });
    execSync("text-decoration: none;", { stdio: 'inherit' });
    execSync("border-radius: 6px;", { stdio: 'inherit' });
    execSync("font-size: 0.875rem;", { stdio: 'inherit' });
    execSync("transition: background 0.2s;", { stdio: 'inherit' });
    execSync("}", { stdio: 'inherit' });

    execSync(".api-link:hover {", { stdio: 'inherit' });
    execSync("background: var(--primary-dark);", { stdio: 'inherit' });
    execSync("}", { stdio: 'inherit' });

    execSync(".api-link.secondary {", { stdio: 'inherit' });
    execSync("background: var(--border);", { stdio: 'inherit' });
    execSync("color: #475569;", { stdio: 'inherit' });
    execSync("}", { stdio: 'inherit' });

    execSync(".api-link.secondary:hover {", { stdio: 'inherit' });
    execSync("background: #cbd5e1;", { stdio: 'inherit' });
    execSync("}", { stdio: 'inherit' });

    execSync("footer {", { stdio: 'inherit' });
    execSync("text-align: center;", { stdio: 'inherit' });
    execSync("padding: 2rem;", { stdio: 'inherit' });
    execSync("color: var(--secondary);", { stdio: 'inherit' });
    execSync("font-size: 0.875rem;", { stdio: 'inherit' });
    execSync("border-top: 1px solid var(--border);", { stdio: 'inherit' });
    execSync("margin-top: 4rem;", { stdio: 'inherit' });
    execSync("}", { stdio: 'inherit' });
    execSync("</style>", { stdio: 'inherit' });
    execSync("</head>", { stdio: 'inherit' });
    execSync("<body>", { stdio: 'inherit' });
    execSync("<header>", { stdio: 'inherit' });
    execSync("<div class=\"container\">", { stdio: 'inherit' });
    execSync("<h1>🚀 OSSA API Documentation</h1>", { stdio: 'inherit' });
    execSync("<p class=\"tagline\">Open Standards for Scalable Agents - v0.1.9</p>", { stdio: 'inherit' });
    execSync("</div>", { stdio: 'inherit' });
    execSync("</header>", { stdio: 'inherit' });

    execSync("<div class=\"container\">", { stdio: 'inherit' });
    execSync("<div class=\"stats\">", { stdio: 'inherit' });
    execSync("<div class=\"stat-card\">", { stdio: 'inherit' });
    execSync("<div class=\"stat-value\">SPECS_COUNT</div>", { stdio: 'inherit' });
    execSync("<div class=\"stat-label\">API Specifications</div>", { stdio: 'inherit' });
    execSync("</div>", { stdio: 'inherit' });
    execSync("<div class=\"stat-card\">", { stdio: 'inherit' });
    execSync("<div class=\"stat-value\">40+</div>", { stdio: 'inherit' });
    execSync("<div class=\"stat-label\">Endpoints</div>", { stdio: 'inherit' });
    execSync("</div>", { stdio: 'inherit' });
    execSync("<div class=\"stat-card\">", { stdio: 'inherit' });
    execSync("<div class=\"stat-value\">v0.1.9</div>", { stdio: 'inherit' });
    execSync("<div class=\"stat-label\">Current Version</div>", { stdio: 'inherit' });
    execSync("</div>", { stdio: 'inherit' });
    execSync("</div>", { stdio: 'inherit' });

    execSync("<div class=\"api-grid\">", { stdio: 'inherit' });
    execSync("API_CARDS_PLACEHOLDER", { stdio: 'inherit' });
    execSync("</div>", { stdio: 'inherit' });
    execSync("</div>", { stdio: 'inherit' });

    execSync("<footer>", { stdio: 'inherit' });
    execSync("<p>Generated on GENERATION_DATE</p>", { stdio: 'inherit' });
    execSync("<p>Powered by OSSA Documentation Engine</p>", { stdio: 'inherit' });
    execSync("</footer>", { stdio: 'inherit' });
    execSync("</body>", { stdio: 'inherit' });
    execSync("</html>", { stdio: 'inherit' });
    execSync("EOF", { stdio: 'inherit' });

    // Build API cards HTML
    const API_CARDS = "";
    execSync("for html_file in \"$API_DOCS_DIR\"/*.html; do", { stdio: 'inherit' });
    execSync("if [ -f \"$html_file\" ] && [ \"$(basename \"$html_file\")\" != \"index.html\" ]; then", { stdio: 'inherit' });
    execSync("NAME=$(basename \"$html_file\" .html)", { stdio: 'inherit' });
    const API_CARDS = "$API_CARDS";
    execSync("<div class=\\\"api-card\\\">", { stdio: 'inherit' });
    execSync("<h2>📘 $NAME</h2>", { stdio: 'inherit' });
    execSync("<p class=\\\"api-description\\\">API specification and interactive documentation</p>", { stdio: 'inherit' });
    execSync("<div class=\\\"api-links\\\">", { stdio: 'inherit' });
    execSync("<a href=\\\"generated/$NAME.html\\\" class=\\\"api-link\\\">View Documentation</a>", { stdio: 'inherit' });
    execSync("<a href=\\\"generated/$NAME.json\\\" class=\\\"api-link secondary\\\">Download JSON</a>", { stdio: 'inherit' });
    execSync("</div>", { stdio: 'inherit' });
    execSync("</div>\"", { stdio: 'inherit' });
    execSync("fi", { stdio: 'inherit' });
    execSync("done", { stdio: 'inherit' });

    // Replace placeholders
    execSync("sed -i \"\" \"s/SPECS_COUNT/$DOCS_GENERATED/g\" \"$API_DOCS_DIR/index.html\"", { stdio: 'inherit' });
    execSync("sed -i \"\" \"s|API_CARDS_PLACEHOLDER|$API_CARDS|g\" \"$API_DOCS_DIR/index.html\"", { stdio: 'inherit' });
    execSync("sed -i \"\" \"s/GENERATION_DATE/$(date '+%B %d, %Y at %H:%M')/g\" \"$API_DOCS_DIR/index.html\"", { stdio: 'inherit' });

    // Copy index to public directory
    execSync("cp \"$API_DOCS_DIR/index.html\" \"$PUBLIC_API_DIR/index.html\"", { stdio: 'inherit' });

    // Summary
    console.log("");
    console.log("====================================");
    console.log("-e ${GREEN}✅ API Documentation Generation Complete${NC}");
    console.log("====================================");
    console.log("Specifications found: $SPECS_FOUND");
    console.log("Documentation generated: $DOCS_GENERATED");
    console.log("");
    console.log("-e ${BLUE}📁 Documentation locations:${NC}");
    console.log("  • Internal: $API_DOCS_DIR");
    console.log("  • Public: $PUBLIC_API_DIR");
    console.log("");
    console.log("-e ${BLUE}🌐 View documentation:${NC}");
    console.log("  open $API_DOCS_DIR/index.html");
    console.log("");

    // Set exit code based on success
    execSync("if [ $DOCS_GENERATED -gt 0 ]; then", { stdio: 'inherit' });
    console.log("-e ${GREEN}✨ API documentation ready for deployment!${NC}");
    execSync("exit 0", { stdio: 'inherit' });
    execSync("else", { stdio: 'inherit' });
    console.log("-e ${YELLOW}⚠️  No documentation was generated. Check your OpenAPI specs.${NC}");
    execSync("exit 1", { stdio: 'inherit' });
    execSync("fi", { stdio: 'inherit' });
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