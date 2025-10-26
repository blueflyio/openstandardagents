/**
 * Validate Command Integration Tests
 * Test the validate CLI command end-to-end
 */
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
describe('ossa validate command', () => {
    let tempDir;
    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ossa-validate-test-'));
    });
    afterEach(() => {
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });
    it('should validate a correct v1.0 manifest', () => {
        const manifestPath = path.join(tempDir, 'valid.ossa.yaml');
        const manifest = `
ossaVersion: "1.0"
agent:
  id: test-agent
  name: Test Agent
  version: 1.0.0
  role: chat
  description: Test agent
  runtime:
    type: docker
  capabilities:
    - name: chat
      description: Chat capability
      input_schema:
        type: object
      output_schema:
        type: object
`;
        fs.writeFileSync(manifestPath, manifest);
        const output = execSync(`node bin/ossa validate ${manifestPath}`, {
            encoding: 'utf-8',
            cwd: path.resolve(__dirname, '../../..'),
        });
        expect(output).toContain('✓');
        expect(output).toContain('valid');
    });
    it('should report validation errors for invalid manifest', () => {
        const manifestPath = path.join(tempDir, 'invalid.ossa.yaml');
        const manifest = `
ossaVersion: "1.0"
agent:
  id: INVALID_ID
  name: Test
  version: 1.0.0
  role: chat
  runtime:
    type: docker
  capabilities: []
`;
        fs.writeFileSync(manifestPath, manifest);
        try {
            execSync(`node bin/ossa validate ${manifestPath}`, {
                encoding: 'utf-8',
                cwd: path.resolve(__dirname, '../../..'),
                stdio: 'pipe',
            });
            // If we got here, the command didn't fail - that's wrong
            expect(true).toBe(false); // Force failure
        }
        catch (error) {
            // Command should exit with error code
            expect(error.status).toBe(1);
        }
    });
    it('should show verbose output when requested', () => {
        const manifestPath = path.join(tempDir, 'agent.ossa.yaml');
        const manifest = `
ossaVersion: "1.0"
agent:
  id: test-agent
  name: Test Agent
  version: 2.5.0
  role: workflow
  description: Workflow agent
  runtime:
    type: k8s
  capabilities:
    - name: execute
      description: Execute workflow
      input_schema:
        type: object
      output_schema:
        type: object
`;
        fs.writeFileSync(manifestPath, manifest);
        const output = execSync(`node bin/ossa validate ${manifestPath} --verbose`, {
            encoding: 'utf-8',
            cwd: path.resolve(__dirname, '../../..'),
        });
        expect(output).toContain('test-agent');
        expect(output).toContain('Test Agent');
        expect(output).toContain('2.5.0');
        expect(output).toContain('workflow');
    });
    it('should show warnings for missing best practices', () => {
        const manifestPath = path.join(tempDir, 'minimal.ossa.yaml');
        const manifest = `
ossaVersion: "1.0"
agent:
  id: minimal
  name: Minimal
  version: 1.0.0
  role: custom
  runtime:
    type: docker
  capabilities:
    - name: test
      description: Test
      input_schema:
        type: object
      output_schema:
        type: object
`;
        fs.writeFileSync(manifestPath, manifest);
        const output = execSync(`node bin/ossa validate ${manifestPath}`, {
            encoding: 'utf-8',
            cwd: path.resolve(__dirname, '../../..'),
        });
        expect(output).toContain('⚠');
        expect(output).toContain('Best practice');
    });
});
//# sourceMappingURL=validate.test.js.map