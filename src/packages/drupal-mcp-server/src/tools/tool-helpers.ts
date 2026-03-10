export const DEFAULT_PAGE_LIMIT = 50;
export const DEFAULT_PAGE_OFFSET = 0;

export interface ToolActionResult {
  success: boolean;
  message: string;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export async function runToolAction(
  action: () => Promise<void>,
  successMessage: string
): Promise<ToolActionResult> {
  try {
    await action();
    return { success: true, message: successMessage };
  } catch (error: unknown) {
    return { success: false, message: getErrorMessage(error) };
  }
}
