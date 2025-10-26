/**
 * Generate Command Integration Tests
 * Test the generate CLI command end-to-end
 */
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { parse as parseYaml } from 'yaml';
describe('ossa generate command', () => {
    let tempDir;
    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ossa-generate-test-'));
    });
    afterEach(() => {
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });
    it('should generate a chat agent', () => {
        const outputPath = path.join(tempDir, 'chat-agent.ossa.yaml');
        const output = execSync(`node bin/ossa generate chat --name "Chat Bot" --output ${outputPath}`, {
            encoding: 'utf-8',
            cwd: path.resolve(__dirname, '../../..'),
        });
        expect(output).toContain('✓');
        expect(output).toContain('generated successfully');
        expect(fs.existsSync(outputPath)).toBe(true);
        // Parse and verify manifest
        const content = fs.readFileSync(outputPath, 'utf-8');
        const manifest = parseYaml(content);
        expect(manifest.ossaVersion).toBe('1.0');
        expect(manifest.agent.id).toBe('chat-bot');
        expect(manifest.agent.name).toBe('Chat Bot');
        expect(manifest.agent.role).toBe('chat');
        expect(manifest.agent.capabilities).toBeDefined();
        expect(manifest.agent.capabilities.length).toBeGreaterThan(0);
    });
    it('should generate workflow agent with correct capabilities', () => {
        const outputPath = path.join(tempDir, 'workflow.ossa.yaml');
        execSync(`node bin/ossa generate workflow --name "Workflow Engine" --output ${outputPath}`, {
            encoding: 'utf-8',
            cwd: path.resolve(__dirname, '../../..'),
        });
        const content = fs.readFileSync(outputPath, 'utf-8');
        const manifest = parseYaml(content);
        expect(manifest.agent.role).toBe('workflow');
        expect(manifest.agent.capabilities[0].name).toBe('execute_workflow');
    });
    it('should generate compliance agent with low temperature', () => {
        const outputPath = path.join(tempDir, 'compliance.ossa.yaml');
        execSync(`node bin/ossa generate compliance --name "Compliance Scanner" --output ${outputPath}`, {
            encoding: 'utf-8',
            cwd: path.resolve(__dirname, '../../..'),
        });
        const content = fs.readFileSync(outputPath, 'utf-8');
        const manifest = parseYaml(content);
        expect(manifest.agent.role).toBe('compliance');
        expect(manifest.agent.llm.temperature).toBe(0.2);
        expect(manifest.agent.llm.maxTokens).toBe(4000);
    });
    it('should use custom runtime type', () => {
        const outputPath = path.join(tempDir, 'k8s-agent.ossa.yaml');
        execSync(`node bin/ossa generate monitoring --name "K8s Monitor" --runtime k8s --output ${outputPath}`, {
            encoding: 'utf-8',
            cwd: path.resolve(__dirname, '../../..'),
        });
        const content = fs.readFileSync(outputPath, 'utf-8');
        const manifest = parseYaml(content);
        expect(manifest.agent.runtime.type).toBe('k8s');
    });
    it('should normalize agent ID', () => {
        const outputPath = path.join(tempDir, 'normalized.ossa.yaml');
        execSync(`node bin/ossa generate chat --name "My Agent With SPACES" --output ${outputPath}`, {
            encoding: 'utf-8',
            cwd: path.resolve(__dirname, '../../..'),
        });
        const content = fs.readFileSync(outputPath, 'utf-8');
        const manifest = parseYaml(content);
        expect(manifest.agent.id).toBe('my-agent-with-spaces');
        expect(manifest.agent.id).toMatch(/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/);
    });
    it('should create output directory if it does not exist', () => {
        const outputPath = path.join(tempDir, 'nested', 'deep', 'agent.ossa.yaml');
        execSync(`node bin/ossa generate chat --name "Test" --output ${outputPath}`, {
            encoding: 'utf-8',
            cwd: path.resolve(__dirname, '../../..'),
        });
        expect(fs.existsSync(outputPath)).toBe(true);
    });
});
//# sourceMappingURL=generate.test.js.map