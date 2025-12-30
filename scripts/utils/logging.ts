/**
 * Logging utilities
 */

export const logInfo = (message: string): void => {
  console.log(`INFO: ${message}`);
};

export const logSuccess = (message: string): void => {
  console.log(`SUCCESS: ${message}`);
};

export const logError = (message: string): void => {
  console.error(`ERROR: ${message}`);
};

export const logWarning = (message: string): void => {
  console.warn(`WARNING: ${message}`);
};
