#!/usr/bin/env node
/**
 * Deploy OSSA Monitoring Stack
 * TypeScript replacement for deploy.sh
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const MONITORING_DIR = __dirname;

interface DeploymentStep {
    name: string;
    file: string;
    required: boolean;
}

const deploymentSteps: DeploymentStep[] = [
    { name: 'Namespace', file: '00-namespace.yaml', required: true },
    { name: 'Prometheus', file: '01-prometheus.yaml', required: true },
    { name: 'Grafana', file: '02-grafana.yaml', required: true },
    { name: 'Alertmanager', file: '03-alertmanager.yaml', required: false },
    { name: 'Node Exporter', file: '04-node-exporter.yaml', required: false },
];

function checkKubectl(): void {
    try {
        execSync('kubectl version --client', { stdio: 'ignore' });
    } catch (error) {
        console.error('❌ kubectl not found. Please install kubectl first.');
        process.exit(1);
    }
}

function deployFile(step: DeploymentStep): void {
    const filePath = join(MONITORING_DIR, step.file);

    if (!existsSync(filePath)) {
        if (step.required) {
            console.error(`❌ Required file not found: ${step.file}`);
            process.exit(1);
        } else {
            console.log(`⏭️  Skipping optional file: ${step.file}`);
            return;
        }
    }

    try {
        console.log(`📦 Deploying ${step.name}...`);
        execSync(`kubectl apply -f ${filePath}`, { stdio: 'inherit', cwd: MONITORING_DIR });
        console.log(`✅ ${step.name} deployed successfully`);
    } catch (error) {
        console.error(`❌ Failed to deploy ${step.name}:`, error);
        process.exit(1);
    }
}

function printAccessInstructions(): void {
    console.log('\n📍 Access dashboards:\n');
    console.log('Prometheus:');
    console.log('  kubectl port-forward -n monitoring svc/prometheus 9090:9090');
    console.log('  Then open: http://localhost:9090\n');
    console.log('Grafana:');
    console.log('  kubectl port-forward -n monitoring svc/grafana 3000:3000');
    console.log('  Then open: http://localhost:3000');
    console.log('  Default credentials: admin/admin\n');
    console.log('🔍 Check status:');
    console.log('  kubectl get pods -n monitoring\n');
}

function main(): void {
    console.log('🚀 Deploying OSSA Monitoring Stack...\n');

    checkKubectl();

    for (const step of deploymentSteps) {
        deployFile(step);
    }

    console.log('\n✅ Monitoring stack deployed!');
    printAccessInstructions();
}

if (require.main === module) {
    main();
}

export { deployFile, checkKubectl };

