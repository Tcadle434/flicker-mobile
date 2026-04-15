import type { AuthEntryMode } from '../../types';

export function resolveAuthEntryMode(
  input: string | string[] | undefined,
): AuthEntryMode {
  const value = Array.isArray(input) ? input[0] : input;

  if (
    value === 'default' ||
    value === 'signinOnly' ||
    value === 'postPaywallRequired'
  ) {
    return value;
  }

  return 'default';
}
