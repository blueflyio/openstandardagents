#!/usr/bin/env node

/**
 * Simple OSSA v0.1.9+ Compliance Checker
 * Basic validation without external dependencies
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

const REQUIRED_OSSA_VERSION = '0.1.9';

function checkProject(projectPath, projectName) {
    console.log(`\n🔍 Checking: ${projectName}`);

    const results = {
        name: projectName,
        path: projectPath,
        ossaConfig: false,
        ossaVersion: null,
        packageJson: false,
        version: null,
        compliant: false,
        issues: []
    };

    // Check for OSSA configuration
    const ossaFiles = ['ossa.yaml', '.ossa.yaml', 'ossa.config.yaml'];
    let ossaContent = null;

    for (const file of ossaFiles) {
        const filePath = join(projectPath, file);
        if (existsSync(filePath)) {
            results.ossaConfig = true;
            try {
                ossaContent = readFileSync(filePath, 'utf8');
                console.log('  ✅ OSSA config found');
                break;
            } catch (error) {
                results.issues.push(`Error reading ${file}: ${error.message}`);
            }
        }
    }

    if (!results.ossaConfig) {
        results.issues.push('❌ Missing OSSA configuration');
        console.log('  ❌ No OSSA config found');
        return results;
    }

    // Extract version from OSSA content
    if (ossaContent) {
        const versionMatch = ossaContent.match(/version:\s*["']?([^"'\s]+)["']?/);
        if (versionMatch) {
            results.ossaVersion = versionMatch[1].replace(/"/g, '');
            if (results.ossaVersion >= REQUIRED_OSSA_VERSION) {
                console.log(`  ✅ OSSA version: ${results.ossaVersion}`);
            } else {
                console.log(`  ❌ Outdated OSSA version: ${results.ossaVersion} (requires ${REQUIRED_OSSA_VERSION}+)`);
                results.issues.push(`Outdated OSSA version: ${results.ossaVersion}`);
            }
        } else {
            results.issues.push('OSSA version not found in config');
            console.log('  ⚠️ OSSA version not specified');
        }
    }

    // Check package.json
    const packageJsonPath = join(projectPath, 'package.json');
    if (existsSync(packageJsonPath)) {
        results.packageJson = true;
        try {
            const packageContent = readFileSync(packageJsonPath, 'utf8');
            const packageJson = JSON.parse(packageContent);
            results.version = packageJson.version;
            console.log(`  ✅ Package version: ${results.version}`);
        } catch (error) {
            results.issues.push(`Error reading package.json: ${error.message}`);
        }
    }

    // Determine compliance
    results.compliant = results.ossaConfig &&
                       results.ossaVersion &&
                       results.ossaVersion >= REQUIRED_OSSA_VERSION &&
                       results.issues.length === 0;

    if (results.compliant) {
        console.log('  🟢 COMPLIANT');
    } else {
        console.log('  🔴 NON-COMPLIANT');
    }

    return results;
}

function main() {
    console.log('🔒 OSSA v0.1.9+ Compliance Quick Check\n');

    const projects = [
        { path: 'OSSA', name: 'OSSA Framework' },
        { path: 'agent_buildkit', name: 'Agent BuildKit' },
        { path: 'llm-platform', name: 'LLM Platform' },
        { path: 'common_npm/agent-brain', name: 'Agent Brain' },
        { path: 'common_npm/agent-mesh', name: 'Agent Mesh' },
        { path: 'common_npm/agent-ops', name: 'Agent Ops' },
        { path: 'common_npm/agent-chat', name: 'Agent Chat' },
        { path: 'common_npm/agent-protocol', name: 'Agent Protocol' }
    ];

    const results = [];
    let compliantCount = 0;

    for (const project of projects) {
        const fullPath = join(process.cwd(), project.path);
        if (existsSync(fullPath)) {
            const result = checkProject(fullPath, project.name);
            results.push(result);
            if (result.compliant) compliantCount++;
        } else {
            console.log(`\n⏭️ Skipping: ${project.name} (not found)`);
        }
    }

    // Summary
    const totalProjects = results.length;
    const complianceRate = (compliantCount / totalProjects) * 100;

    console.log('\n📊 COMPLIANCE SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Projects Checked: ${totalProjects}`);
    console.log(`Compliant Projects: ${compliantCount}`);
    console.log(`Non-Compliant Projects: ${totalProjects - compliantCount}`);
    console.log(`Compliance Rate: ${complianceRate.toFixed(1)}%`);

    if (complianceRate >= 95) {
        console.log('\n🏆 GOLD CERTIFICATION: ELIGIBLE');
    } else {
        console.log('\n🚫 GOLD CERTIFICATION: NOT ELIGIBLE');
        console.log(`   Required: 95% | Actual: ${complianceRate.toFixed(1)}%`);
    }

    // List non-compliant projects
    const nonCompliant = results.filter(r => !r.compliant);
    if (nonCompliant.length > 0) {
        console.log('\n❌ NON-COMPLIANT PROJECTS:');
        nonCompliant.forEach(project => {
            console.log(`   • ${project.name}: ${project.issues.join(', ')}`);
        });
    }

    return complianceRate >= 95;
}

if (import.meta.url === `file://${process.argv[1]}`) {
    const isCompliant = main();
    process.exit(isCompliant ? 0 : 1);
}