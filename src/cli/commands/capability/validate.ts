import { Command } from 'commander';
import { promises as fs } from 'fs';
import * as path from 'path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats'; // Required for date-time, uri, email, etc.
import { fileURLToPath } from 'url';

// Resolve paths relative to the current module, assuming this script is part of the CLI package
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Adjust path to reach the schemas directory from the CLI command's location
const SCHEMA_DIR = path.resolve(__dirname, '../../../schemas');

export const validateCapabilityCommand = new Command('capability')
  .description('Validate an OSSA Capability Contract file against the schema.')
  .argument('<file>', 'Path to the capability contract JSON file.')
  .action(async (filePath: string) => {
    console.log(`Validating capability contract: ${filePath}`);

    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv); // Add common formats like date-time, uri, email

    let contractSchema: any;
    try {
      // Load the capability contract schema from the defined schema directory
      const schemaPath = path.join(SCHEMA_DIR, 'capability-contract.v0.json');
      const schemaContent = await fs.readFile(schemaPath, 'utf-8');
      contractSchema = JSON.parse(schemaContent);
      console.log('Capability contract schema loaded successfully.');
    } catch (error: any) {
      console.error(
        `Error loading capability contract schema from ${SCHEMA_DIR}/capability-contract.v0.json: ${error.message}`
      );
      process.exit(1);
    }

    // Compile the schema for validation
    const validate = ajv.compile(contractSchema);

    let contractFileContent: any;
    try {
      const fullPath = path.resolve(process.cwd(), filePath);
      const fileContent = await fs.readFile(fullPath, 'utf-8');
      contractFileContent = JSON.parse(fileContent);
      console.log(`Capability contract file ${filePath} read successfully.`);
    } catch (error: any) {
      console.error(
        `Error reading or parsing capability contract file ${filePath}: ${error.message}`
      );
      process.exit(1);
    }

    // Perform validation
    const isValid = validate(contractFileContent);

    if (isValid) {
      console.log(
        `✅ Capability contract ${filePath} is valid according to schema v0.`
      );
    } else {
      console.error(`❌ Capability contract ${filePath} is invalid.`);
      if (validate.errors) {
        // Log detailed errors for debugging
        validate.errors.forEach((err) => {
          console.error(
            `- ${err.instancePath || 'Root'}: ${err.message} (${err.keyword})`
          );
        });
      }
      process.exit(1); // Exit with a non-zero code to indicate failure
    }
  });
