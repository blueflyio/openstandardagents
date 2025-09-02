/**
 * OAAS to OSSA Migration Tool
 * Converts existing OAAS agents to the new OSSA canonical resource model
 */
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { glob } from 'glob';
export class OAASToOSSAMigrator {
    constructor(options) {
        this.options = options;
        this.ossaVersion = 'open-standards-scalable-agents/v0.1.2';
    }
    async migrateWorkspace() {
        console.log('🔄 Starting OAAS to OSSA migration...');
        // Find all agent files
        const agentFiles = await this.findAgentFiles();
        console.log(`📋 Found ${agentFiles.length} agent files to migrate`);
        const migrationResults = [];
        for (const agentFile of agentFiles) {
            try {
                const result = await this.migrateAgent(agentFile);
                migrationResults.push(result);
                if (result.status === 'success') {
                    console.log(`✅ ${result.source} → ${result.target} (${result.level})`);
                }
                else if (result.status === 'error') {
                    console.log(`❌ ${result.source}: ${result.message}`);
                }
                else {
                    console.log(`⏭️  ${result.source}: ${result.message}`);
                }
            }
            catch (error) {
                console.error(`💥 Failed to migrate ${agentFile}:`, error.message);
                migrationResults.push({
                    source: agentFile,
                    target: '',
                    status: 'error',
                    level: 'unknown',
                    message: error.message
                });
            }
        }
        this.generateMigrationReport(migrationResults);
    }
    async findAgentFiles() {
        const patterns = [
            '**/.agents/agent.yml',
            '**/.agents/agent.yaml',
            '**/.agents/*/agent.yml',
            '**/.agents/*/agent.yaml',
            '**/agent.yml',
            '**/agent.yaml'
        ];
        const files = [];
        for (const pattern of patterns) {
            const matches = await glob(pattern, {
                cwd: this.options.workspace,
                ignore: ['**/node_modules/**', '**/.git/**', '**/target/**', '**/build/**']
            });
            files.push(...matches.map(f => path.resolve(this.options.workspace, f)));
        }
        return [...new Set(files)]; // Remove duplicates
    }
    async migrateAgent(filePath) {
        const relativePath = path.relative(this.options.workspace, filePath);
        // Check if already OSSA format
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('open-standards-scalable-agents')) {
            return {
                source: relativePath,
                target: '',
                status: 'skipped',
                level: 'already-ossa',
                message: 'Already in OSSA format'
            };
        }
        // Parse existing agent
        let oaasAgent;
        try {
            oaasAgent = yaml.load(content);
        }
        catch (error) {
            return {
                source: relativePath,
                target: '',
                status: 'error',
                level: 'unknown',
                message: `Failed to parse YAML: ${error.message}`
            };
        }
        // Determine target conformance level
        const targetLevel = this.determineConformanceLevel(oaasAgent);
        // Convert to OSSA format
        const ossaAgent = this.convertToOSSA(oaasAgent, targetLevel);
        // Create backup if requested
        if (this.options.backup) {
            const backupPath = `${filePath}.oaas-backup`;
            fs.copyFileSync(filePath, backupPath);
        }
        // Write new format
        if (!this.options.dryRun) {
            const newPath = this.options.preserveOriginal
                ? `${filePath.replace('.yml', '.ossa.yml').replace('.yaml', '.ossa.yaml')}`
                : filePath;
            const ossaContent = yaml.dump(ossaAgent, {
                indent: 2,
                lineWidth: 120,
                noRefs: true
            });
            fs.writeFileSync(newPath, ossaContent, 'utf8');
            return {
                source: relativePath,
                target: path.relative(this.options.workspace, newPath),
                status: 'success',
                level: targetLevel
            };
        }
        else {
            return {
                source: relativePath,
                target: `${relativePath} (dry-run)`,
                status: 'success',
                level: targetLevel,
                message: 'Dry run - no files modified'
            };
        }
    }
    determineConformanceLevel(agent) {
        if (this.options.targetLevel) {
            return this.options.targetLevel;
        }
        // Auto-detect based on agent complexity and features
        let score = 0;
        // Basic features
        if (agent.capabilities && agent.capabilities.length > 0)
            score += 10;
        if (agent.frameworks)
            score += 10;
        if (agent.api_endpoints)
            score += 10;
        if (agent.context_paths)
            score += 10;
        // Advanced features
        if (agent.security)
            score += 30;
        if (agent.monitoring)
            score += 20;
        if (agent.compliance)
            score += 40;
        if (agent.governance)
            score += 30;
        if (agent.audit)
            score += 25;
        // Determine level based on score
        if (score >= 80)
            return 'advanced';
        if (score >= 40)
            return 'governed';
        return 'core';
    }
    convertToOSSA(oaasAgent, level) {
        const ossaAgent = {
            apiVersion: this.ossaVersion,
            kind: 'Agent',
            metadata: {
                name: this.sanitizeName(oaasAgent.name),
                version: oaasAgent.version || '1.0.0',
                namespace: 'default',
                labels: {
                    tier: level,
                    domain: this.extractDomain(oaasAgent.expertise),
                    'migration.ossa.io/source': 'oaas'
                },
                annotations: {
                    'ossa.io/conformance-level': level,
                    'ossa.io/migration-date': new Date().toISOString().split('T')[0],
                    'ossa.io/source-format': 'oaas'
                }
            },
            spec: {
                agent: {
                    name: oaasAgent.name,
                    expertise: oaasAgent.expertise
                },
                capabilities: this.convertCapabilities(oaasAgent.capabilities),
                discovery: {
                    uadp: {
                        enabled: true,
                        tags: this.generateTags(oaasAgent),
                        priority: 50
                    }
                }
            }
        };
        // Add optional sections based on original content
        if (oaasAgent.frameworks) {
            ossaAgent.spec.frameworks = this.convertFrameworks(oaasAgent.frameworks);
        }
        if (oaasAgent.context_paths) {
            ossaAgent.spec.context = {
                paths: oaasAgent.context_paths.map(cp => ({
                    path: cp.path,
                    description: cp.description,
                    type: this.inferPathType(cp.path)
                }))
            };
        }
        // Add level-specific features
        if (level === 'governed' || level === 'advanced') {
            this.addGovernedFeatures(ossaAgent, oaasAgent);
        }
        if (level === 'advanced') {
            this.addAdvancedFeatures(ossaAgent, oaasAgent);
        }
        return ossaAgent;
    }
    sanitizeName(name) {
        return name.toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/^-+|-+$/g, '')
            .replace(/-+/g, '-');
    }
    extractDomain(expertise) {
        const keywords = {
            'data': ['data', 'analytics', 'analysis', 'statistics'],
            'security': ['security', 'audit', 'compliance', 'risk'],
            'processing': ['process', 'workflow', 'automation', 'transform'],
            'communication': ['chat', 'conversation', 'dialogue', 'communication'],
            'research': ['research', 'search', 'knowledge', 'information'],
            'development': ['code', 'development', 'programming', 'software']
        };
        const lowerExpertise = expertise.toLowerCase();
        for (const [domain, terms] of Object.entries(keywords)) {
            if (terms.some(term => lowerExpertise.includes(term))) {
                return domain;
            }
        }
        return 'general';
    }
    convertCapabilities(capabilities) {
        if (!capabilities)
            return [];
        return capabilities.map(cap => {
            if (typeof cap === 'string') {
                return {
                    name: cap,
                    description: `Capability: ${cap}`,
                    frameworks: ['mcp']
                };
            }
            else {
                return {
                    name: cap.name,
                    description: cap.description,
                    frameworks: ['mcp', 'langchain']
                };
            }
        });
    }
    convertFrameworks(frameworks) {
        const converted = {};
        // Handle various OAAS framework formats
        if (frameworks.mcp !== undefined) {
            converted.mcp = {
                enabled: !!frameworks.mcp || frameworks.mcp === 'enabled',
                config: typeof frameworks.mcp === 'object' ? frameworks.mcp : {}
            };
        }
        if (frameworks.langchain !== undefined) {
            converted.langchain = {
                enabled: !!frameworks.langchain || frameworks.langchain === 'enabled',
                integration: 'tools'
            };
        }
        if (frameworks.crewai !== undefined) {
            converted.crewai = {
                enabled: !!frameworks.crewai || frameworks.crewai === 'enabled',
                role: 'specialist'
            };
        }
        // Ensure at least MCP is enabled
        if (Object.keys(converted).length === 0) {
            converted.mcp = { enabled: true };
        }
        return converted;
    }
    generateTags(agent) {
        const tags = [];
        // Extract tags from expertise
        const expertise = agent.expertise.toLowerCase();
        const commonTags = ['data', 'analysis', 'processing', 'automation', 'security', 'research', 'development'];
        commonTags.forEach(tag => {
            if (expertise.includes(tag)) {
                tags.push(tag);
            }
        });
        // Add capability-based tags
        if (agent.capabilities) {
            agent.capabilities.forEach(cap => {
                const capName = typeof cap === 'string' ? cap : cap.name;
                tags.push(capName.split('_')[0]); // First word of capability
            });
        }
        return [...new Set(tags)].slice(0, 6); // Limit to 6 unique tags
    }
    inferPathType(path) {
        const lowerPath = path.toLowerCase();
        if (lowerPath.includes('src') || lowerPath.includes('lib'))
            return 'code';
        if (lowerPath.includes('docs') || lowerPath.includes('doc'))
            return 'docs';
        if (lowerPath.includes('data') || lowerPath.includes('dataset'))
            return 'data';
        if (lowerPath.includes('config') || lowerPath.includes('settings'))
            return 'config';
        if (lowerPath.includes('test') || lowerPath.includes('spec'))
            return 'tests';
        return 'docs';
    }
    addGovernedFeatures(ossaAgent, oaasAgent) {
        // Add basic security if not present
        if (oaasAgent.security) {
            ossaAgent.spec.security = this.convertSecurity(oaasAgent.security);
        }
        else {
            ossaAgent.spec.security = {
                authentication: {
                    required: true,
                    methods: ['api_key', 'jwt']
                }
            };
        }
        // Add monitoring
        ossaAgent.spec.monitoring = {
            enabled: true,
            metrics: ['response_time', 'throughput', 'error_rate']
        };
        // Add orchestration patterns
        ossaAgent.spec.orchestration = {
            patterns: ['sequential', 'parallel'],
            timeout: '30s'
        };
    }
    addAdvancedFeatures(ossaAgent, oaasAgent) {
        // Add compliance frameworks
        ossaAgent.spec.compliance = {
            frameworks: ['iso_42001'],
            audit: {
                enabled: true,
                level: 'comprehensive',
                retention: '7y'
            }
        };
        // Add governance
        ossaAgent.spec.governance = {
            stakeholders: [
                {
                    role: 'owner',
                    contact: 'agent-owner@organization.com'
                }
            ]
        };
    }
    convertSecurity(security) {
        // Convert OAAS security format to OSSA format
        return {
            authentication: {
                required: security.authentication?.required ?? true,
                methods: security.authentication?.methods ?? ['api_key']
            },
            authorization: security.authorization ? {
                enabled: security.authorization.enabled,
                model: security.authorization.model || 'rbac',
                policies: security.authorization.policies || []
            } : undefined,
            encryption: security.encryption ? {
                in_transit: security.encryption.in_transit ?? true,
                at_rest: security.encryption.at_rest ?? false
            } : undefined
        };
    }
    generateMigrationReport(results) {
        console.log('\n📊 Migration Summary:');
        console.log('==========================================');
        const successful = results.filter(r => r.status === 'success');
        const errors = results.filter(r => r.status === 'error');
        const skipped = results.filter(r => r.status === 'skipped');
        console.log(`✅ Successfully migrated: ${successful.length}`);
        console.log(`⏭️  Skipped: ${skipped.length}`);
        console.log(`❌ Errors: ${errors.length}`);
        // Level breakdown
        const levelCounts = successful.reduce((acc, r) => {
            acc[r.level] = (acc[r.level] || 0) + 1;
            return acc;
        }, {});
        console.log('\nConformance Level Distribution:');
        Object.entries(levelCounts).forEach(([level, count]) => {
            console.log(`  ${level}: ${count}`);
        });
        if (errors.length > 0) {
            console.log('\n❌ Errors:');
            errors.forEach(error => {
                console.log(`  ${error.source}: ${error.message}`);
            });
        }
        // Generate detailed report file
        const reportPath = path.join(this.options.workspace, 'ossa-migration-report.json');
        fs.writeFileSync(reportPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            summary: {
                total: results.length,
                successful: successful.length,
                errors: errors.length,
                skipped: skipped.length
            },
            levelDistribution: levelCounts,
            details: results
        }, null, 2));
        console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    }
}
// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const workspace = args[0] || process.cwd();
    const options = {
        workspace,
        dryRun: args.includes('--dry-run'),
        backup: args.includes('--backup'),
        targetLevel: args.find(arg => arg.startsWith('--level='))?.split('=')[1],
        preserveOriginal: args.includes('--preserve-original')
    };
    const migrator = new OAASToOSSAMigrator(options);
    migrator.migrateWorkspace().catch(console.error);
}
