/**
 * OSSA Validate Command
 *
 * Validates OSSA agent manifests against the OSSA 1.0 JSON Schema.
 */

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const yaml = require('yaml');

module.exports = async function validate(agentPath, options) {
  try {
    console.log(`Validating OSSA agent: ${agentPath}`);

    // Load schema
    const schemaPath = path.resolve(process.cwd(), options.schema);
    if (!fs.existsSync(schemaPath)) {
      console.error(`Error: Schema not found at ${schemaPath}`);
      process.exit(1);
    }

    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));

    // Load agent manifest
    const manifestPath = path.resolve(process.cwd(), agentPath);
    if (!fs.existsSync(manifestPath)) {
      console.error(`Error: Agent manifest not found at ${manifestPath}`);
      process.exit(1);
    }

    let agent;
    if (manifestPath.endsWith('.json')) {
      agent = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    } else if (
      manifestPath.endsWith('.yml') ||
      manifestPath.endsWith('.yaml')
    ) {
      agent = yaml.parse(fs.readFileSync(manifestPath, 'utf-8'));
    } else {
      console.error('Error: Manifest must be .json, .yml, or .yaml');
      process.exit(1);
    }

    // Validate
    const ajv = new Ajv({ allErrors: true, verbose: options.verbose });
    addFormats(ajv);
    const validate = ajv.compile(schema);
    const valid = validate(agent);

    if (valid) {
      console.log('\u2713 Agent manifest is valid OSSA 1.0');

      if (options.verbose) {
        console.log('\nAgent Details:');
        console.log(`  ID: ${agent.agent.id}`);
        console.log(`  Name: ${agent.agent.name}`);
        console.log(`  Version: ${agent.agent.version}`);
        console.log(`  Role: ${agent.agent.role}`);
        console.log(`  Capabilities: ${agent.agent.capabilities.length}`);
      }

      process.exit(0);
    } else {
      console.error('\u2717 Validation failed\n');
      console.error('Errors:');

      validate.errors.forEach((error, index) => {
        console.error(
          `  ${index + 1}. ${error.instancePath || 'root'}: ${error.message}`
        );

        if (options.verbose && error.params) {
          console.error(`     Params: ${JSON.stringify(error.params)}`);
        }
      });

      process.exit(1);
    }
  } catch (error) {
    console.error('Error during validation:', error.message);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
};
