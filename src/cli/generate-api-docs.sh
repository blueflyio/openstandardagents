#!/bin/bash
# OSSA API Documentation Generator
# Generates beautiful API documentation from OpenAPI specs

set -e

echo "🚀 OSSA API Documentation Generator"
echo "===================================="
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

OSSA_DIR="/Users/flux423/Sites/LLM/OSSA"
API_DOCS_DIR="$OSSA_DIR/docs/api/generated"
PUBLIC_API_DIR="$OSSA_DIR/public/docs/api"

# Create output directories
echo -e "${BLUE}📁 Creating output directories...${NC}"
mkdir -p "$API_DOCS_DIR"
mkdir -p "$PUBLIC_API_DIR"

# Function to generate documentation
generate_docs() {
    local spec_file=$1
    local output_name=$2
    
    if [ -f "$spec_file" ]; then
        echo -e "${BLUE}📝 Generating docs for: $output_name${NC}"
        
        # Use npx to run redocly without installation
        if npx @redocly/cli build-docs "$spec_file" \
            --output "$API_DOCS_DIR/${output_name}.html" 2>/dev/null; then
            echo -e "  ${GREEN}✅ Generated: ${output_name}.html${NC}"
            
            # Copy to public directory for GitLab Pages
            cp "$API_DOCS_DIR/${output_name}.html" "$PUBLIC_API_DIR/${output_name}.html"
            
            # Generate JSON bundle
            npx @redocly/cli bundle "$spec_file" \
                --output "$API_DOCS_DIR/${output_name}.json" \
                --ext json 2>/dev/null || true
                
            return 0
        else
            echo -e "  ${RED}❌ Failed to generate docs for: $output_name${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  Spec file not found: $spec_file${NC}"
        return 1
    fi
}

# Find and process OpenAPI specifications
echo -e "${BLUE}🔍 Finding OpenAPI specifications...${NC}"

SPECS_FOUND=0
DOCS_GENERATED=0

# Check main API directory
if [ -d "$OSSA_DIR/src/api" ]; then
    for spec in "$OSSA_DIR/src/api"/*.yml "$OSSA_DIR/src/api"/*.yaml; do
        if [ -f "$spec" ]; then
            SPECS_FOUND=$((SPECS_FOUND + 1))
            NAME=$(basename "$spec" | sed 's/\.\(yml\|yaml\)$//')
            generate_docs "$spec" "$NAME" && DOCS_GENERATED=$((DOCS_GENERATED + 1))
        fi
    done
fi

# Check docs/api directory
if [ -d "$OSSA_DIR/docs/api" ]; then
    for spec in "$OSSA_DIR/docs/api"/*.yml "$OSSA_DIR/docs/api"/*.yaml; do
        if [ -f "$spec" ]; then
            SPECS_FOUND=$((SPECS_FOUND + 1))
            NAME=$(basename "$spec" | sed 's/\.\(yml\|yaml\)$//')
            generate_docs "$spec" "$NAME" && DOCS_GENERATED=$((DOCS_GENERATED + 1))
        fi
    done
fi

# Generate master index
echo -e "${BLUE}📚 Generating master API index...${NC}"

cat > "$API_DOCS_DIR/index.html" <<'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OSSA API Documentation Portal</title>
    <style>
        :root {
            --primary: #2563eb;
            --primary-dark: #1e40af;
            --secondary: #64748b;
            --background: #f8fafc;
            --card-bg: white;
            --border: #e2e8f0;
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
            background: var(--background);
            color: #1e293b;
            line-height: 1.6;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        header {
            background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
            color: white;
            padding: 3rem 0;
            margin-bottom: 3rem;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        h1 {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
        }
        
        .tagline {
            font-size: 1.125rem;
            opacity: 0.9;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin-bottom: 3rem;
        }
        
        .stat-card {
            background: var(--card-bg);
            padding: 1.5rem;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            text-align: center;
        }
        
        .stat-value {
            font-size: 2.5rem;
            font-weight: 700;
            color: var(--primary);
            margin-bottom: 0.5rem;
        }
        
        .stat-label {
            color: var(--secondary);
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        
        .api-grid {
            display: grid;
            gap: 1.5rem;
        }
        
        .api-card {
            background: var(--card-bg);
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .api-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .api-card h2 {
            color: #1e293b;
            font-size: 1.25rem;
            margin-bottom: 0.5rem;
        }
        
        .api-description {
            color: var(--secondary);
            margin-bottom: 1rem;
            font-size: 0.875rem;
        }
        
        .api-links {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
        }
        
        .api-link {
            display: inline-block;
            padding: 0.5rem 1rem;
            background: var(--primary);
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-size: 0.875rem;
            transition: background 0.2s;
        }
        
        .api-link:hover {
            background: var(--primary-dark);
        }
        
        .api-link.secondary {
            background: var(--border);
            color: #475569;
        }
        
        .api-link.secondary:hover {
            background: #cbd5e1;
        }
        
        footer {
            text-align: center;
            padding: 2rem;
            color: var(--secondary);
            font-size: 0.875rem;
            border-top: 1px solid var(--border);
            margin-top: 4rem;
        }
    </style>
</head>
<body>
    <header>
        <div class="container">
            <h1>🚀 OSSA API Documentation</h1>
            <p class="tagline">Open Standards for Scalable Agents - v0.1.9</p>
        </div>
    </header>
    
    <div class="container">
        <div class="stats">
            <div class="stat-card">
                <div class="stat-value">SPECS_COUNT</div>
                <div class="stat-label">API Specifications</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">40+</div>
                <div class="stat-label">Endpoints</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">v0.1.9</div>
                <div class="stat-label">Current Version</div>
            </div>
        </div>
        
        <div class="api-grid">
            API_CARDS_PLACEHOLDER
        </div>
    </div>
    
    <footer>
        <p>Generated on GENERATION_DATE</p>
        <p>Powered by OSSA Documentation Engine</p>
    </footer>
</body>
</html>
EOF

# Build API cards HTML
API_CARDS=""
for html_file in "$API_DOCS_DIR"/*.html; do
    if [ -f "$html_file" ] && [ "$(basename "$html_file")" != "index.html" ]; then
        NAME=$(basename "$html_file" .html)
        API_CARDS="$API_CARDS
            <div class=\"api-card\">
                <h2>📘 $NAME</h2>
                <p class=\"api-description\">API specification and interactive documentation</p>
                <div class=\"api-links\">
                    <a href=\"generated/$NAME.html\" class=\"api-link\">View Documentation</a>
                    <a href=\"generated/$NAME.json\" class=\"api-link secondary\">Download JSON</a>
                </div>
            </div>"
    fi
done

# Replace placeholders
sed -i "" "s/SPECS_COUNT/$DOCS_GENERATED/g" "$API_DOCS_DIR/index.html"
sed -i "" "s|API_CARDS_PLACEHOLDER|$API_CARDS|g" "$API_DOCS_DIR/index.html"
sed -i "" "s/GENERATION_DATE/$(date '+%B %d, %Y at %H:%M')/g" "$API_DOCS_DIR/index.html"

# Copy index to public directory
cp "$API_DOCS_DIR/index.html" "$PUBLIC_API_DIR/index.html"

# Summary
echo ""
echo "===================================="
echo -e "${GREEN}✅ API Documentation Generation Complete${NC}"
echo "===================================="
echo "Specifications found: $SPECS_FOUND"
echo "Documentation generated: $DOCS_GENERATED"
echo ""
echo -e "${BLUE}📁 Documentation locations:${NC}"
echo "  • Internal: $API_DOCS_DIR"
echo "  • Public: $PUBLIC_API_DIR"
echo ""
echo -e "${BLUE}🌐 View documentation:${NC}"
echo "  open $API_DOCS_DIR/index.html"
echo ""

# Set exit code based on success
if [ $DOCS_GENERATED -gt 0 ]; then
    echo -e "${GREEN}✨ API documentation ready for deployment!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  No documentation was generated. Check your OpenAPI specs.${NC}"
    exit 1
fi