import { useCurrencyStore } from '../../stores/currencyStore';
import { useSanctuaryStore } from '../../stores/sanctuaryStore';
import { useTentStore } from '../../stores/tentStore';
import { loadSanctuaryData } from '../sanctuary/sanctuaryLoader';

export async function hydrateAuthenticatedUserData(): Promise<void> {
  loadSanctuaryData();

  await Promise.all([
    useCurrencyStore.getState().hydrate(),
    useSanctuaryStore.getState().hydrate(),
    useTentStore.getState().hydrate(),
  ]);
}

export function resetAuthenticatedUserData(): void {
  useCurrencyStore.getState().resetForAuthChange();
  useSanctuaryStore.getState().resetForAuthChange();
  useTentStore.getState().resetForAuthChange();
}
