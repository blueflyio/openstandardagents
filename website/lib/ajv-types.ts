// Create proper types for AJV error params
export interface AjvErrorParams {
  additionalProperty?: string;
  allowedValues?: unknown[];
  type?: string;
  missingProperty?: string;
  [key: string]: unknown;
}

