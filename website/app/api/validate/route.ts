import { NextResponse } from 'next/server';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import fs from 'fs';
import path from 'path';
import yaml from 'yaml';

const ajv = new Ajv({ allErrors: true, verbose: true });
addFormats(ajv);

let schemaCache: any = null;

function loadSchema(): any {
  if (schemaCache) {
    return schemaCache;
  }

  const schemaPath = path.join(
    process.cwd(),
    '../../../spec/v0.2.3/ossa-0.2.2.schema.json'
  );

  if (!fs.existsSync(schemaPath)) {
    throw new Error('OSSA schema not found');
  }

  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  schemaCache = JSON.parse(schemaContent);
  return schemaCache;
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { content } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { valid: false, errors: [{ path: '', message: 'Content is required' }] },
        { status: 400 }
      );
    }

    const schema = loadSchema();
    const validate = ajv.compile(schema);

    let parsed: any;
    try {
      parsed = yaml.parse(content);
    } catch (yamlError) {
      try {
        parsed = JSON.parse(content);
      } catch (jsonError) {
        return NextResponse.json({
          valid: false,
          errors: [{ path: '', message: 'Invalid YAML or JSON format' }],
        });
      }
    }

    const valid = validate(parsed);

    if (!valid && validate.errors) {
      return NextResponse.json({
        valid: false,
        errors: validate.errors.map((error) => ({
          path: error.instancePath || error.schemaPath || '',
          message: error.message || 'Validation error',
        })),
      });
    }

    return NextResponse.json({ valid: true, errors: [] });
  } catch (error) {
    return NextResponse.json(
      {
        valid: false,
        errors: [
          {
            path: '',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        ],
      },
      { status: 500 }
    );
  }
}

