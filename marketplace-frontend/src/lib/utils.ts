import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function generateGAID(name: string, version: string): string {
  // Simple GAID generation (replace with actual implementation)
  const hash = Buffer.from(`${name}-${version}`).toString('base64');
  return `gaid-${hash.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 32)}`;
}

export function validateGAID(gaid: string): boolean {
  return /^gaid-[a-z0-9]{32}$/.test(gaid);
}
