# ╔═══════════════════════════════════════════════════════════════════════════════╗
# ║                                                                               ║
# ║   ██████╗ ███████╗███████╗ █████╗     ██╗   ██╗ ██████╗    ██████╗  ██████╗   ║
# ║  ██╔═══██╗██╔════╝██╔════╝██╔══██╗    ██║   ██║██╔═████╗   ╚════██╗██╔═████╗  ║
# ║  ██║   ██║███████╗███████╗███████║    ██║   ██║██║██╔██║    █████╔╝██║██╔██║  ║
# ║  ██║   ██║╚════██║╚════██║██╔══██║    ╚██╗ ██╔╝████╔╝██║    ╚═══██╗████╔╝██║  ║
# ║  ╚██████╔╝███████║███████║██║  ██║     ╚████╔╝ ╚██████╔╝██╗██████╔╝╚██████╔╝  ║
# ║   ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝      ╚═══╝   ╚═════╝ ╚═╝╚═════╝  ╚═════╝   ║
# ║                                                                               ║
# ║                        QUICKSTART: GET RUNNING IN 60 SECONDS                  ║
# ║                                                                               ║
# ╚═══════════════════════════════════════════════════════════════════════════════╝

#Requires -Version 5.1

[CmdletBinding()]
param(
    [string]$InstallMethod = $env:OSSA_INSTALL_METHOD ?? "global",
    [string]$Provider = $env:LLM_PROVIDER ?? "anthropic",
    [string]$Model = $env:LLM_MODEL ?? "claude-sonnet-4-20250514",
    [string]$AgentFile = $env:OSSA_AGENT_FILE ?? "my-first-agent.ossa.yaml"
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# ═══════════════════════════════════════════════════════════════════════════════
# COLOR CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

$Colors = @{
    Red     = "Red"
    Green   = "Green"
    Yellow  = "Yellow"
    Blue    = "Blue"
    Magenta = "Magenta"
    Cyan    = "Cyan"
    White   = "White"
    Gray    = "Gray"
}

$Symbols = @{
    CheckMark = [char]0x2713  # ✓
    CrossMark = [char]0x2717  # ✗
    Arrow     = [char]0x2192  # →
    Rocket    = [char]0x1F680 # 🚀
    Party     = [char]0x1F389 # 🎉
    Warning   = [char]0x26A0  # ⚠
    Info      = [char]0x2139  # ℹ
}

# ═══════════════════════════════════════════════════════════════════════════════
# UTILITY FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host $Message -ForegroundColor Cyan -NoNewline
    Write-Host ""
}

function Write-Step {
    param(
        [int]$Step,
        [int]$Total,
        [string]$Message
    )
    Write-Host ""
    Write-Host "[$Step/$Total] $Message" -ForegroundColor White
    Write-Host "$([string]::new([char]0x2500, 70))" -ForegroundColor Gray
}

function Write-Success {
    param([string]$Message)
    Write-Host "     " -NoNewline
    Write-Host "$($Symbols.CheckMark) " -ForegroundColor Green -NoNewline
    Write-Host $Message
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "     " -NoNewline
    Write-Host "$($Symbols.CrossMark) " -ForegroundColor Red -NoNewline
    Write-Host $Message
}

function Write-Info {
    param([string]$Message)
    Write-Host "     " -NoNewline
    Write-Host "$($Symbols.Info) " -ForegroundColor Blue -NoNewline
    Write-Host $Message
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "     " -NoNewline
    Write-Host "$($Symbols.Warning) " -ForegroundColor Yellow -NoNewline
    Write-Host $Message
}

function Write-Box {
    param([string]$Message)
    $width = 70
    Write-Host "$([string]::new([char]0x2550, $width))" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "$([string]::new([char]0x2550, $width))" -ForegroundColor Cyan
}

function Test-Command {
    param([string]$Command)
    $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

function Get-CommandVersion {
    param([string]$Command)

    switch ($Command) {
        "node" {
            if (Test-Command "node") {
                $version = node --version 2>$null
                return $version -replace "^v", ""
            }
        }
        "npm" {
            if (Test-Command "npm") {
                return npm --version 2>$null
            }
        }
        "ossa" {
            if (Test-Command "ossa") {
                $output = ossa --version 2>$null
                if ($output -match '(\d+\.\d+\.\d+)') {
                    return $matches[1]
                }
            }
        }
    }
    return "unknown"
}

# ═══════════════════════════════════════════════════════════════════════════════
# MAIN WORKFLOW
# ═══════════════════════════════════════════════════════════════════════════════

function Main {
    Clear-Host

    # Header
    Write-Host @"

🚀 OSSA Quickstart
══════════════════

"@ -ForegroundColor Cyan

    Write-Host "Open Standard for Scalable AI Agents" -ForegroundColor Gray
    Write-Host "Get running in 60 seconds...`n" -ForegroundColor Gray

    # Step 1: Check dependencies
    Write-Step -Step 1 -Total 4 -Message "Checking dependencies..."
    Test-Dependencies

    # Step 2: Install OSSA CLI
    Write-Step -Step 2 -Total 4 -Message "Installing OSSA CLI..."
    Install-OssaCli

    # Step 3: Create sample agent
    Write-Step -Step 3 -Total 4 -Message "Creating your first agent..."
    New-SampleAgent

    # Step 4: Validate agent
    Write-Step -Step 4 -Total 4 -Message "Validating manifest..."
    Test-Agent

    # Success message
    Show-SuccessMessage
}

# ───────────────────────────────────────────────────────────────────────────────
# STEP 1: CHECK DEPENDENCIES
# ───────────────────────────────────────────────────────────────────────────────
function Test-Dependencies {
    $allGood = $true

    # Check Node.js
    if (Test-Command "node") {
        $nodeVersion = Get-CommandVersion "node"
        Write-Success "Node.js v$nodeVersion"

        # Warn if version is too old
        $majorVersion = [int]($nodeVersion -split '\.')[0]
        if ($majorVersion -lt 18) {
            Write-Warning-Custom "Node.js 18+ recommended (you have v$nodeVersion)"
        }
    }
    else {
        Write-Error-Custom "Node.js not found"
        Write-Info "Install from: https://nodejs.org"
        $allGood = $false
    }

    # Check npm
    if (Test-Command "npm") {
        $npmVersion = Get-CommandVersion "npm"
        Write-Success "npm v$npmVersion"
    }
    else {
        Write-Error-Custom "npm not found (should come with Node.js)"
        $allGood = $false
    }

    # Check for API keys
    $hasKey = $false
    if ($env:ANTHROPIC_API_KEY) {
        Write-Success "ANTHROPIC_API_KEY found"
        $hasKey = $true
        $script:Provider = "anthropic"
    }
    if ($env:OPENAI_API_KEY) {
        Write-Success "OPENAI_API_KEY found"
        $hasKey = $true
        if (-not $script:Provider) { $script:Provider = "openai" }
    }
    if ($env:GOOGLE_API_KEY) {
        Write-Success "GOOGLE_API_KEY found"
        $hasKey = $true
    }

    if (-not $hasKey) {
        Write-Warning-Custom "No LLM API key detected"
        Write-Info "Set one of: ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_API_KEY"
        Write-Info "Or use Ollama for local models (free): https://ollama.ai"
    }

    if (-not $allGood) {
        Write-Host ""
        Write-Host "Missing required dependencies. Please install them first." -ForegroundColor Red
        exit 1
    }
}

# ───────────────────────────────────────────────────────────────────────────────
# STEP 2: INSTALL OSSA CLI
# ───────────────────────────────────────────────────────────────────────────────
function Install-OssaCli {
    if (Test-Command "ossa") {
        $ossaVersion = Get-CommandVersion "ossa"
        Write-Success "@bluefly/ossa-cli v$ossaVersion already installed"
        return
    }

    if ($InstallMethod -eq "global") {
        Write-Info "Installing @bluefly/ossa-cli globally..."
        try {
            npm install -g @bluefly/ossa-cli 2>$null | Out-Null
            $ossaVersion = Get-CommandVersion "ossa"
            Write-Success "@bluefly/ossa-cli v$ossaVersion installed"
        }
        catch {
            Write-Error-Custom "Failed to install via npm"
            Write-Info "Try running PowerShell as Administrator"
            Write-Info "Or use npx: `$env:OSSA_INSTALL_METHOD = 'npx'"
            exit 1
        }
    }
    else {
        Write-Success "Will use npx @bluefly/ossa-cli (no installation needed)"
    }
}

# ───────────────────────────────────────────────────────────────────────────────
# STEP 3: CREATE SAMPLE AGENT
# ───────────────────────────────────────────────────────────────────────────────
function New-SampleAgent {
    if (Test-Path $AgentFile) {
        Write-Warning-Custom "File already exists: $AgentFile"
        Write-Info "Skipping creation (file preserved)"
        return
    }

    $agentContent = @'
# ╔═══════════════════════════════════════════════════════════════════════════════╗
# ║                                                                               ║
# ║   ██████╗ ███████╗███████╗ █████╗     ██╗   ██╗ ██████╗    ██████╗  ██████╗   ║
# ║  ██╔═══██╗██╔════╝██╔════╝██╔══██╗    ██║   ██║██╔═████╗   ╚════██╗██╔═████╗  ║
# ║  ██║   ██║███████╗███████╗███████║    ██║   ██║██║██╔██║    █████╔╝██║██╔██║  ║
# ║  ██║   ██║╚════██║╚════██║██╔══██║    ╚██╗ ██╔╝████╔╝██║    ╚═══██╗████╔╝██║  ║
# ║  ╚██████╔╝███████║███████║██║  ██║     ╚████╔╝ ╚██████╔╝██╗██████╔╝╚██████╔╝  ║
# ║   ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝      ╚═══╝   ╚═════╝ ╚═╝╚═════╝  ╚═════╝   ║
# ║                                                                               ║
# ║                        YOUR FIRST OSSA AGENT                                  ║
# ║                                                                               ║
# ╚═══════════════════════════════════════════════════════════════════════════════╝
#
# This is your first OSSA agent manifest. Think of it like:
#   • package.json for npm
#   • Dockerfile for containers
#   • OpenAPI spec for REST APIs
#
# It's a declarative configuration that any OSSA-compliant runtime can execute.

# ──────────────────────────────────────────────────────────────────────────────────
# API VERSION & KIND (Required)
# ──────────────────────────────────────────────────────────────────────────────────
apiVersion: ossa/v0.3.0
kind: Agent

# ──────────────────────────────────────────────────────────────────────────────────
# METADATA (Required)
# ──────────────────────────────────────────────────────────────────────────────────
metadata:
  name: my-first-agent
  version: 1.0.0
  description: |
    A friendly AI assistant created with OSSA Quickstart.
    This agent demonstrates the minimal required configuration.
  labels:
    created-by: ossa-quickstart
    difficulty: beginner

# ──────────────────────────────────────────────────────────────────────────────────
# AGENT CONFIGURATION
# ──────────────────────────────────────────────────────────────────────────────────
spec:
  # The agent's persona (system prompt)
  role: |
    You are a friendly and helpful AI assistant created with OSSA
    (Open Standard for Scalable AI Agents).

    Your purpose:
    • Answer questions clearly and accurately
    • Help users understand AI agent concepts
    • Provide examples when they clarify ideas
    • Admit when you don't know something

    Communication style:
    • Be concise but thorough
    • Use markdown for clarity
    • Be encouraging to learners
    • Break down complex topics

  # LLM configuration (vendor-neutral)
  llm:
    provider: ${LLM_PROVIDER:-anthropic}
    model: ${LLM_MODEL:-claude-sonnet-4-20250514}
    temperature: 0.7

# ═══════════════════════════════════════════════════════════════════════════════
# NEXT STEPS
# ═══════════════════════════════════════════════════════════════════════════════
#
# 1. Set your API key:
#    $env:ANTHROPIC_API_KEY = "sk-ant-..."
#
# 2. Run interactively:
#    ossa run my-first-agent.ossa.yaml --interactive
#
# 3. Learn more:
#    • Docs: https://openstandardagents.org/docs
#    • Examples: https://github.com/blueflyio/openstandardagents/tree/main/examples
#    • Spec: https://openstandardagents.org/spec
#
# 4. Explore advanced features:
#    ossa init my-advanced-agent --template full
#
# ═══════════════════════════════════════════════════════════════════════════════
'@

    $agentContent | Out-File -FilePath $AgentFile -Encoding UTF8
    Write-Success "Created: $AgentFile" -ForegroundColor Cyan
}

# ───────────────────────────────────────────────────────────────────────────────
# STEP 4: VALIDATE AGENT
# ───────────────────────────────────────────────────────────────────────────────
function Test-Agent {
    $ossaCmd = if ($InstallMethod -eq "npx" -or -not (Test-Command "ossa")) {
        "npx", "-y", "@bluefly/ossa-cli"
    }
    else {
        "ossa"
    }

    Write-Info "Running validation..."

    try {
        $result = & $ossaCmd validate $AgentFile 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Schema validation passed"
            Write-Success "LLM configuration valid"
            Write-Success "Ready to run!"
        }
        else {
            Write-Warning-Custom "Validation encountered issues"
            Write-Info "Run manually: $ossaCmd validate $AgentFile"
        }
    }
    catch {
        Write-Warning-Custom "Could not validate (this is OK)"
        Write-Info "Try: $ossaCmd validate $AgentFile"
    }
}

# ───────────────────────────────────────────────────────────────────────────────
# SUCCESS MESSAGE
# ───────────────────────────────────────────────────────────────────────────────
function Show-SuccessMessage {
    Write-Host ""
    Write-Box "`n$($Symbols.Party) SUCCESS! Your first OSSA agent is ready."
    Write-Host ""

    $ossaCmd = if ($InstallMethod -eq "npx" -or -not (Test-Command "ossa")) {
        "npx @bluefly/ossa-cli"
    }
    else {
        "ossa"
    }

    Write-Host "Next steps:`n" -ForegroundColor White

    Write-Host "  1. Set your API key:"
    switch ($Provider) {
        "anthropic" {
            Write-Host "     `$env:ANTHROPIC_API_KEY = `"sk-ant-...`"" -ForegroundColor Cyan
            Write-Host "     Get key: https://console.anthropic.com" -ForegroundColor Gray
        }
        "openai" {
            Write-Host "     `$env:OPENAI_API_KEY = `"sk-...`"" -ForegroundColor Cyan
            Write-Host "     Get key: https://platform.openai.com/api-keys" -ForegroundColor Gray
        }
        default {
            Write-Host "     `$env:ANTHROPIC_API_KEY = `"sk-ant-...`"" -ForegroundColor Cyan
            Write-Host "     Or use: OPENAI_API_KEY, GOOGLE_API_KEY" -ForegroundColor Gray
        }
    }
    Write-Host ""

    Write-Host "  2. Run your agent:"
    Write-Host "     $ossaCmd run $AgentFile --interactive" -ForegroundColor Cyan
    Write-Host ""

    Write-Host "  3. Explore examples:"
    Write-Host "     $ossaCmd init my-agent --template advanced" -ForegroundColor Cyan
    Write-Host "     See: https://github.com/blueflyio/openstandardagents/tree/main/examples" -ForegroundColor Gray
    Write-Host ""

    Write-Host "  4. Learn more:"
    Write-Host "     Docs:     " -NoNewline -ForegroundColor Gray
    Write-Host "https://openstandardagents.org/docs" -ForegroundColor Cyan
    Write-Host "     Spec:     " -NoNewline -ForegroundColor Gray
    Write-Host "https://openstandardagents.org/spec" -ForegroundColor Cyan
    Write-Host "     GitHub:   " -NoNewline -ForegroundColor Gray
    Write-Host "https://github.com/blueflyio/openstandardagents" -ForegroundColor Cyan
    Write-Host "     Discord:  " -NoNewline -ForegroundColor Gray
    Write-Host "https://discord.gg/ossa" -ForegroundColor Cyan
    Write-Host ""

    Write-Box ""

    Write-Host "`nTip: Try 'ossa --help' to see all commands`n" -ForegroundColor Gray
}

# ═══════════════════════════════════════════════════════════════════════════════
# ENTRY POINT
# ═══════════════════════════════════════════════════════════════════════════════

try {
    Main
}
catch {
    Write-Host ""
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host "Stack trace:" -ForegroundColor Gray
    Write-Host $_.ScriptStackTrace -ForegroundColor Gray
    exit 1
}
