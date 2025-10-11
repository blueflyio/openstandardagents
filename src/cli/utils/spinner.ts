/**
 * Spinner utility for CLI loading indicators
 * Provides ora-like spinner interface
 */

import ora, { Ora } from 'ora';

export function spinner(text: string): Ora {
  return ora({
    text,
    color: 'cyan',
    spinner: 'dots'
  });
}
