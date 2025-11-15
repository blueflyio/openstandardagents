import fs from 'fs';
import path from 'path';
import { SchemaExplorer } from '@/components/schema/SchemaExplorer';

function loadSchema(): any {
  // Load schema from website/public/ (Next.js convention) or fallback to spec/
  const schemaPaths = [
    path.join(process.cwd(), 'public/schemas/ossa-0.2.3.schema.json'),
    path.join(process.cwd(), '../../spec/v0.2.3/ossa-0.2.3.schema.json'),
    path.join(process.cwd(), '../../spec/v0.2.2/ossa-0.2.2.schema.json'),
  ];

  for (const schemaPath of schemaPaths) {
    if (fs.existsSync(schemaPath)) {
      const schemaContent = fs.readFileSync(schemaPath, 'utf8');
      return JSON.parse(schemaContent);
    }
  }

  return null;
}

export default function SchemaPage(): JSX.Element {
  const schema = loadSchema();

  if (!schema) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-4xl font-bold mb-4">Schema Explorer</h1>
        <p className="text-lg text-gray-600">
          Schema file not found. Please ensure the OSSA schema is available.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">Open Standard Agents Schema Explorer</h1>
      <p className="text-lg text-gray-600 mb-8">
        Explore the Open Standard Agents v0.2.3 JSON Schema interactively. Understand the
        structure, properties, and validation rules.
      </p>
      <SchemaExplorer schema={schema} />
    </div>
  );
}

