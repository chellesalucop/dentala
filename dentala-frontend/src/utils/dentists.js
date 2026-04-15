export function formatDentistName(nameOrEmail) {
  if (!nameOrEmail) {
    return '';
  }

  const normalizedName = String(nameOrEmail).trim().replace(/^dr\.?\s+/i, '');

  return `Dr. ${normalizedName}`;
}