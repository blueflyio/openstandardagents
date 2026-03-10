import { describe, expect, test, jest } from '@jest/globals';
import { getErrorMessage, runToolAction } from '../src/tools/tool-helpers';

describe('tool helpers', () => {
  test('getErrorMessage returns message from Error objects', () => {
    const message = getErrorMessage(new Error('drupal failure'));

    expect(message).toBe('drupal failure');
  });

  test('getErrorMessage returns string value for non-Error inputs', () => {
    const message = getErrorMessage('raw failure');

    expect(message).toBe('raw failure');
  });

  test('runToolAction returns success payload for successful actions', async () => {
    const action = jest.fn(async () => {});

    const result = await runToolAction(action, 'completed');

    expect(action).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ success: true, message: 'completed' });
  });

  test('runToolAction normalizes thrown errors into failure payload', async () => {
    const action = jest.fn(async () => {
      throw new Error('boom');
    });

    const result = await runToolAction(action, 'completed');

    expect(action).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ success: false, message: 'boom' });
  });

  test('runToolAction handles non-Error throws', async () => {
    const action = jest.fn(async () => {
      throw 'string boom';
    });

    const result = await runToolAction(action, 'completed');

    expect(result).toEqual({ success: false, message: 'string boom' });
  });
});
