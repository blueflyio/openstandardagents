'use client';

import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface SchemaExplorerProps {
  schema: any;
}

interface PropertyInfo {
  name: string;
  type: string;
  description?: string;
  required?: boolean;
  properties?: PropertyInfo[];
}

function extractProperties(schema: any, path = ''): PropertyInfo[] {
  if (!schema || typeof schema !== 'object') {
    return [];
  }

  const properties: PropertyInfo[] = [];

  if (schema.properties) {
    for (const [key, value] of Object.entries(schema.properties)) {
      const prop = value as any;
      const propInfo: PropertyInfo = {
        name: key,
        type: prop.type || 'object',
        description: prop.description,
        required: schema.required?.includes(key),
      };

      if (prop.properties || prop.items) {
        propInfo.properties = extractProperties(
          prop.properties || prop.items,
          `${path}.${key}`
        );
      }

      properties.push(propInfo);
    }
  }

  return properties;
}

export function SchemaExplorer({ schema }: SchemaExplorerProps) {
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    new Set([''])
  );

  const rootProperties = extractProperties(schema);

  const togglePath = (path: string): void => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const renderProperty = (
    prop: PropertyInfo,
    depth = 0,
    currentPath = ''
  ) => {
    const fullPath = currentPath ? `${currentPath}.${prop.name}` : prop.name;
    const isExpanded = expandedPaths.has(fullPath);
    const hasChildren = prop.properties && prop.properties.length > 0;

    return (
      <div key={prop.name} className="ml-4">
        <div
          className={`flex items-start py-2 ${
            selectedPath === fullPath ? 'bg-primary/10' : ''
          }`}
        >
          {hasChildren && (
            <button
              onClick={() => togglePath(fullPath)}
              className="mr-2 text-gray-500 hover:text-gray-700"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? '−' : '+'}
            </button>
          )}
          <div
            className="flex-1 cursor-pointer"
            onClick={() => setSelectedPath(fullPath)}
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">{prop.name}</span>
              <span className="text-sm text-gray-500">({prop.type})</span>
              {prop.required && (
                <span className="text-xs bg-error/20 text-error px-2 py-0.5 rounded">
                  required
                </span>
              )}
            </div>
            {prop.description && (
              <p className="text-sm text-gray-600 mt-1">{prop.description}</p>
            )}
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="ml-6 border-l-2 border-gray-200">
            {prop.properties?.map((child) =>
              renderProperty(child, depth + 1, fullPath)
            )}
          </div>
        )}
      </div>
    );
  };

  const getPropertyAtPath = (path: string): any => {
    const parts = path.split('.').filter(Boolean);
    let current: any = schema;

    for (const part of parts) {
      if (current?.properties?.[part]) {
        current = current.properties[part];
      } else {
        return null;
      }
    }

    return current;
  };

  const selectedProperty = selectedPath
    ? getPropertyAtPath(selectedPath)
    : schema;

  return (
    <div className="space-y-6">
      {/* Property Tree - Row 1 */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Schema Structure</h2>
        <div className="space-y-1 max-h-[400px] overflow-y-auto">
          {rootProperties.map((prop) => renderProperty(prop))}
        </div>
      </div>

      {/* Property Details - Row 2 */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">
          {selectedPath || 'Schema Overview'}
        </h2>
        {selectedProperty && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Type</h3>
              <p className="text-gray-700">{selectedProperty.type || 'object'}</p>
            </div>

            {selectedProperty.description && (
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-700">{selectedProperty.description}</p>
              </div>
            )}

            {selectedProperty.enum && (
              <div>
                <h3 className="font-semibold mb-2">Allowed Values</h3>
                <ul className="list-disc list-inside text-gray-700">
                  {selectedProperty.enum.map((value: any, index: number) => (
                    <li key={index}>{String(value)}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedProperty.default !== undefined && (
              <div>
                <h3 className="font-semibold mb-2">Default Value</h3>
                <p className="text-gray-700">
                  {JSON.stringify(selectedProperty.default)}
                </p>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-2">JSON Schema</h3>
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <SyntaxHighlighter
                  language="json"
                  style={vscDarkPlus}
                  customStyle={{
                    margin: 0,
                    fontSize: '12px',
                  }}
                >
                  {JSON.stringify(selectedProperty, null, 2)}
                </SyntaxHighlighter>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

