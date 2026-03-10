export const DEFAULT_PAGE_LIMIT = 50;
export const DEFAULT_PAGE_OFFSET = 0;

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
