/**
 * Table utility for CLI output
 * Renders data in tabular format
 */

import Table from 'cli-table3';

export function table(data: any[], columns: string[]) {
  if (!data || data.length === 0) {
    console.log('No data to display');
    return;
  }

  const t = new Table({
    head: columns,
    style: {
      head: ['cyan'],
      border: ['gray']
    }
  });

  data.forEach((row) => {
    const values = columns.map((col) => {
      const value = row[col];
      if (value === undefined || value === null) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    });
    t.push(values);
  });

  console.log(t.toString());
}
