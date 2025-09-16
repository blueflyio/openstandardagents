#!/bin/bash

# OSSA Development Recovery Tools
# Moved from common_npm to proper OSSA services directory

WORKTREE_BASE="$HOME/Sites/LLM/OSSA/.worktrees"
LOG_DIR="$HOME/Sites/LLM/OSSA/.worktrees/recovery-logs"
mkdir -p "$LOG_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to run pattern-based recovery
run_pattern_recovery() {
    local worktree="recovery-1-pattern-fix"
    local log_file="$LOG_DIR/$worktree-$(date +%Y%m%d-%H%M%S).log"
    
    echo -e "${YELLOW}Starting PATTERN-BASED recovery in $worktree${NC}"
    
    (
        cd "$WORKTREE_BASE/$worktree"
        echo "=== Pattern-based recovery started at $(date) ===" > "$log_file"
        
        # Apply systematic pattern fixes for OSSA development
        echo "Applying OSSA-specific pattern fixes..." >> "$log_file"
        
        # Fix import.meta.url patterns in OSSA TypeScript files
        find src -name "*.ts" -type f -exec sed -i '' 's/import\.meta\.url}/import.meta.url)/g' {} \; 2>&1 | tee -a "$log_file"
        
        # Fix function call endings
        find src -name "*.ts" -type f -exec sed -i '' 's/\([a-zA-Z0-9_]\+([^)]*\)}/\1)/g' {} \; 2>&1 | tee -a "$log_file"
        
        # Fix object key hyphenation for OSSA agent names
        find src -name "*.ts" -type f -exec sed -i '' "s/\([a-zA-Z]\+\)-\([a-zA-Z]\+\):/'\1-\2':/g" {} \; 2>&1 | tee -a "$log_file"
        
        # Fix semicolon issues in OSSA CLI commands
        find src -name "*.ts" -type f -exec sed -i '' 's/};/);/g' {} \; 2>&1 | tee -a "$log_file"
        
        # Test OSSA compilation
        echo "Testing OSSA TypeScript compilation..." >> "$log_file"
        npx tsc --noEmit 2>&1 | tee -a "$log_file"
        
        error_count=$(npx tsc --noEmit 2>&1 | grep -c error || echo "0")
        echo "=== Pattern recovery completed at $(date) ===" >> "$log_file"
        echo "Final error count: $error_count" >> "$log_file"
        
        # Commit if improved
        if [ "$error_count" -lt "50000" ]; then
            git add -A && git commit -m "OSSA pattern-based recovery: $error_count errors remaining" 2>&1 | tee -a "$log_file"
        fi
        
        echo "$error_count" > "$WORKTREE_BASE/$worktree/.recovery-complete"
    ) &
    
    echo "Pattern recovery PID: $!"
    echo "$!" > "$LOG_DIR/$worktree.pid"
}

# Function to run selective recovery for OSSA components
run_selective_recovery() {
    local worktree="recovery-3-selective"
    local log_file="$LOG_DIR/$worktree-$(date +%Y%m%d-%H%M%S).log"
    
    echo -e "${BLUE}Starting SELECTIVE OSSA component recovery in $worktree${NC}"
    
    (
        cd "$WORKTREE_BASE/$worktree"
        echo "=== Selective OSSA recovery started at $(date) ===" > "$log_file"
        
        # Create directory for recovered OSSA files
        mkdir -p src-recovered
        
        # Try to recover working OSSA components
        echo "Identifying compilable OSSA components..." >> "$log_file"
        
        for file in src/**/*.ts; do
            if [ -f "$file" ]; then
                # Test if this specific OSSA component compiles
                npx tsc --noEmit "$file" 2>/dev/null
                if [ $? -eq 0 ]; then
                    echo "Recovered OSSA component: $file" >> "$log_file"
                    cp "$file" "src-recovered/$(basename $file)"
                else
                    echo "Failed OSSA component: $file" >> "$log_file"
                fi
            fi
        done
        
        # Count recovered OSSA files
        recovered_count=$(ls -1 src-recovered/*.ts 2>/dev/null | wc -l || echo "0")
        echo "=== Selective OSSA recovery completed at $(date) ===" >> "$log_file"
        echo "Recovered OSSA components: $recovered_count" >> "$log_file"
        
        echo "$recovered_count" > "$WORKTREE_BASE/$worktree/.recovery-complete"
    ) &
    
    echo "Selective recovery PID: $!"
    echo "$!" > "$LOG_DIR/$worktree.pid"
}

# Function to run clean OSSA rebuild
run_clean_rebuild() {
    local worktree="recovery-2-clean-rebuild"
    local log_file="$LOG_DIR/$worktree-$(date +%Y%m%d-%H%M%S).log"
    
    echo -e "${GREEN}Starting CLEAN OSSA REBUILD in $worktree${NC}"
    
    (
        cd "$WORKTREE_BASE/$worktree"
        echo "=== Clean OSSA rebuild started at $(date) ===" > "$log_file"
        
        # Save essential OSSA config files
        echo "Preserving OSSA configuration files..." >> "$log_file"
        cp package.json package.json.bak 2>&1 | tee -a "$log_file"
        cp tsconfig.json tsconfig.json.bak 2>&1 | tee -a "$log_file"
        cp README.md README.md.bak 2>&1 | tee -a "$log_file"
        cp ROADMAP.md ROADMAP.md.bak 2>&1 | tee -a "$log_file"
        
        # Check if OSSA CLI exists and can generate clean structure
        if command -v ossa &> /dev/null; then
            echo "Using OSSA CLI to generate clean structure..." >> "$log_file"
            ossa create clean-rebuild --domain recovery --tier advanced --priority high 2>&1 | tee -a "$log_file"
        else
            echo "Creating minimal clean OSSA structure..." >> "$log_file"
            
            # Create minimal clean OSSA CLI structure
            mkdir -p src/commands src/adapters src/workflows
            
            cat > src/cli.ts << 'EOF'
#!/usr/bin/env node
import { Command } from 'commander';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

const program = new Command();

program
  .name('ossa')
  .description('OSSA CLI - Recovery Build')
  .version(packageJson.version);

program
  .command('recovery')
  .description('OSSA recovery tools')
  .action(() => {
    console.log('OSSA recovery tools - clean rebuild successful');
  });

program.parse(process.argv);
EOF
        fi
        
        # Test OSSA compilation
        echo "Testing clean OSSA rebuild..." >> "$log_file"
        npx tsc --noEmit 2>&1 | tee -a "$log_file"
        
        error_count=$(npx tsc --noEmit 2>&1 | grep -c error || echo "0")
        echo "=== Clean OSSA rebuild completed at $(date) ===" >> "$log_file"
        echo "Final error count: $error_count" >> "$log_file"
        
        echo "$error_count" > "$WORKTREE_BASE/$worktree/.recovery-complete"
    ) &
    
    echo "Clean rebuild PID: $!"
    echo "$!" > "$LOG_DIR/$worktree.pid"
}

# Function to monitor OSSA recovery progress
monitor_progress() {
    while true; do
        clear
        echo -e "${YELLOW}=== OSSA Parallel Recovery Progress ===${NC}"
        echo ""
        
        for worktree in "$WORKTREE_BASE"/*; do
            if [ -d "$worktree" ]; then
                name=$(basename "$worktree")
                
                # Check if completed
                if [ -f "$worktree/.recovery-complete" ]; then
                    result=$(cat "$worktree/.recovery-complete")
                    echo -e "${GREEN}✓ $name: COMPLETE (Result: $result)${NC}"
                else
                    # Check if running
                    pid_file="$LOG_DIR/$name.pid"
                    if [ -f "$pid_file" ]; then
                        pid=$(cat "$pid_file")
                        if ps -p "$pid" > /dev/null 2>&1; then
                            echo -e "${YELLOW}⟳ $name: RUNNING (PID: $pid)${NC}"
                        else
                            echo -e "${RED}✗ $name: FAILED${NC}"
                        fi
                    else
                        echo "? $name: NOT STARTED"
                    fi
                fi
                
                # Show last log line
                log_file=$(ls -t "$LOG_DIR/$name-"*.log 2>/dev/null | head -1)
                if [ -f "$log_file" ]; then
                    last_line=$(tail -1 "$log_file" | cut -c1-60)
                    echo "  Last: $last_line..."
                fi
                echo ""
            fi
        done
        
        # Check if all complete
        complete_count=0
        total_count=0
        for worktree in "$WORKTREE_BASE"/*; do
            if [ -d "$worktree" ]; then
                total_count=$((total_count + 1))
                if [ -f "$worktree/.recovery-complete" ]; then
                    complete_count=$((complete_count + 1))
                fi
            fi
        done
        
        if [ "$complete_count" -eq "$total_count" ] && [ "$total_count" -gt 0 ]; then
            echo -e "${GREEN}All OSSA recovery operations complete!${NC}"
            break
        fi
        
        sleep 5
    done
}

# Main execution
case "${1:-run}" in
    run)
        echo -e "${YELLOW}Starting OSSA parallel recovery operations...${NC}"
        run_pattern_recovery
        run_selective_recovery
        run_clean_rebuild
        echo ""
        echo -e "${GREEN}All OSSA recovery operations started!${NC}"
        echo "Monitor with: $0 monitor"
        ;;
    monitor)
        monitor_progress
        ;;
    stop)
        echo "Stopping all OSSA recovery operations..."
        for pid_file in "$LOG_DIR"/*.pid; do
            if [ -f "$pid_file" ]; then
                pid=$(cat "$pid_file")
                kill "$pid" 2>/dev/null && echo "Stopped PID: $pid"
                rm "$pid_file"
            fi
        done
        ;;
    results)
        echo -e "${YELLOW}=== OSSA Recovery Results ===${NC}"
        for worktree in "$WORKTREE_BASE"/*; do
            if [ -d "$worktree" ]; then
                name=$(basename "$worktree")
                if [ -f "$worktree/.recovery-complete" ]; then
                    result=$(cat "$worktree/.recovery-complete")
                    echo "$name: $result"
                fi
            fi
        done
        ;;
    *)
        echo "Usage: $0 {run|monitor|stop|results}"
        echo "OSSA Development Recovery Tools"
        ;;
esac