/**
 * OSSA Wizard Validators
 * Validation functions for user input
 */

export function validateDNS1123(name: string): boolean {
  return /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(name) && name.length <= 253;
}

export function validateSemver(version: string): boolean {
  return /^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$/.test(version);
}

export function validateURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePort(port: number): boolean {
  return port > 0 && port <= 65535;
}

export function validateJSONSchema(schema: string): boolean {
  try {
    JSON.parse(schema);
    return true;
  } catch {
    return false;
  }
}
