/**
 * OSSA Deployment Driver Factory Tests
 */

import { describe, it, expect } from '@jest/globals';
import { createDeploymentDriver } from '../../../src/deploy/index.js';
import { LocalDeploymentDriver } from '../../../src/deploy/local-driver.js';
import { DockerDeploymentDriver } from '../../../src/deploy/docker-driver.js';
import { KubernetesDeploymentDriver } from '../../../src/deploy/k8s-driver.js';

describe('createDeploymentDriver', () => {
  it('should create local driver', () => {
    const driver = createDeploymentDriver('local');
    expect(driver).toBeInstanceOf(LocalDeploymentDriver);
  });

  it('should create docker driver', () => {
    const driver = createDeploymentDriver('docker');
    expect(driver).toBeInstanceOf(DockerDeploymentDriver);
  });

  it('should create kubernetes driver', () => {
    const driver = createDeploymentDriver('kubernetes');
    expect(driver).toBeInstanceOf(KubernetesDeploymentDriver);
  });

  it('should throw error for unknown target', () => {
    expect(() => createDeploymentDriver('unknown' as any)).toThrow(
      'Unknown deployment target'
    );
  });
});
