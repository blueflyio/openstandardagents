/**
 * OSSA Schema Command
 *
 * Query and display OSSA schema information and attributes.
 */

const fs = require('fs');
const path = require('path');

module.exports = async function schema(action, options) {
  try {
    const schemaPath = path.resolve(
      __dirname,
      '../../../spec/ossa-1.0.schema.json'
    );

    if (!fs.existsSync(schemaPath)) {
      console.error('Error: OSSA schema not found');
      process.exit(1);
    }

    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));

    switch (action) {
      case 'info':
        displaySchemaInfo(schema);
        break;

      case 'roles':
        displayRoles(schema);
        break;

      case 'runtime-types':
        displayRuntimeTypes(schema);
        break;

      case 'protocols':
        displayProtocols(schema);
        break;

      case 'compliance':
        displayComplianceFrameworks(schema);
        break;

      case 'bridges':
        displayBridges(schema);
        break;

      case 'all':
        displaySchemaInfo(schema);
        displayRoles(schema);
        displayRuntimeTypes(schema);
        displayProtocols(schema);
        displayComplianceFrameworks(schema);
        displayBridges(schema);
        break;

      default:
        console.log('\nOSSA Schema Commands:\n');
        console.log(
          '  ossa schema info              - Schema version and details'
        );
        console.log('  ossa schema roles             - Available agent roles');
        console.log(
          '  ossa schema runtime-types     - Supported runtime types'
        );
        console.log(
          '  ossa schema protocols         - Communication protocols'
        );
        console.log('  ossa schema compliance        - Compliance frameworks');
        console.log('  ossa schema bridges           - Protocol bridges');
        console.log('  ossa schema all               - Show everything\n');
        break;
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    if (options?.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
};

function displaySchemaInfo(schema) {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                    OSSA SCHEMA INFO');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`  Title:        ${schema.title}`);
  console.log(`  Description:  ${schema.description}`);
  console.log(`  Schema ID:    ${schema.$id}`);
  console.log(`  Type:         ${schema.type}`);
  console.log(`  Required:     ${schema.required.join(', ')}`);
  console.log('');
}

function displayRoles(schema) {
  const roles = schema.properties.agent.properties.role.enum;
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                    AGENT ROLES');
  console.log('═══════════════════════════════════════════════════════════\n');
  roles.forEach((role) => {
    console.log(`  • ${role}`);
  });
  console.log('');
}

function displayRuntimeTypes(schema) {
  const types = schema.properties.agent.properties.runtime.properties.type.enum;
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                    RUNTIME TYPES');
  console.log('═══════════════════════════════════════════════════════════\n');
  types.forEach((type) => {
    console.log(`  • ${type}`);
  });
  console.log('');
}

function displayProtocols(schema) {
  const protocols =
    schema.properties.agent.properties.integration.properties.protocol.enum;
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                  COMMUNICATION PROTOCOLS');
  console.log('═══════════════════════════════════════════════════════════\n');
  protocols.forEach((proto) => {
    console.log(`  • ${proto}`);
  });
  console.log('');
}

function displayComplianceFrameworks(schema) {
  const frameworks =
    schema.properties.agent.properties.policies.properties.compliance.items
      .enum;
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                 COMPLIANCE FRAMEWORKS');
  console.log('═══════════════════════════════════════════════════════════\n');
  frameworks.forEach((framework) => {
    console.log(`  • ${framework}`);
  });
  console.log('');
}

function displayBridges(schema) {
  const bridges = Object.keys(
    schema.properties.agent.properties.bridge.properties
  );
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                    PROTOCOL BRIDGES');
  console.log('═══════════════════════════════════════════════════════════\n');
  bridges.forEach((bridge) => {
    const desc =
      schema.properties.agent.properties.bridge.properties[bridge].description;
    console.log(`  • ${bridge}`);
    if (desc) {
      console.log(`    ${desc}`);
    }
  });
  console.log('');
}
