/**
 * Template Engine - Unit tests for render and renderConditional
 */

import { describe, it, expect } from '@jest/globals';
import { render, renderConditional } from '../../../../src/adapters/base/template-engine.js';

describe('render', () => {
  it('replaces {{key}} with value', () => {
    const out = render('Hello {{name}}', { name: 'World' });
    expect(out).toBe('Hello World');
  });

  it('replaces multiple placeholders', () => {
    const out = render('{{a}} and {{b}}', { a: 'x', b: 'y' });
    expect(out).toBe('x and y');
  });

  it('replaces missing key with empty string', () => {
    const out = render('Hello {{name}}', {});
    expect(out).toBe('Hello ');
  });

  it('handles number and boolean', () => {
    expect(render('{{n}}', { n: 42 })).toBe('42');
    expect(render('{{flag}}', { flag: true })).toBe('true');
  });

  it('joins array with comma space', () => {
    const out = render('Items: {{list}}', { list: ['a', 'b'] });
    expect(out).toBe('Items: a, b');
  });
});

describe('renderConditional', () => {
  it('interpolates variables', () => {
    const out = renderConditional('{{title}}', { title: 'Test' });
    expect(out).toBe('Test');
  });

  it('includes {{#if key}} block when key is truthy', () => {
    const out = renderConditional('{{#if show}}yes{{/if}}', { show: true });
    expect(out).toBe('yes');
  });

  it('omits {{#if key}} block when key is falsy', () => {
    const out = renderConditional('{{#if show}}yes{{/if}}', { show: false });
    expect(out).toBe('');
  });

  it('includes {{#unless key}} block when key is falsy', () => {
    const out = renderConditional('{{#unless hide}}visible{{/unless}}', {
      hide: false,
    });
    expect(out).toBe('visible');
  });

  it('omits {{#unless key}} block when key is truthy', () => {
    const out = renderConditional('{{#unless hide}}visible{{/unless}}', {
      hide: true,
    });
    expect(out).toBe('');
  });

  it('expands {{#each items}} with {{.}}', () => {
    const out = renderConditional('{{#each items}}({{.}}){{/each}}', {
      items: ['a', 'b'],
    });
    expect(out).toBe('(a)(b)');
  });

  it('omits {{#each}} when not array or empty', () => {
    expect(
      renderConditional('{{#each items}}x{{/each}}', { items: [] })
    ).toBe('');
    expect(
      renderConditional('{{#each items}}x{{/each}}', {})
    ).toBe('');
  });
});
