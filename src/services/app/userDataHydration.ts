import { useCurrencyStore } from '../../stores/currencyStore';
import { useSanctuaryStore } from '../../stores/sanctuaryStore';
import { useStreakStore } from '../../stores/streakStore';
import { useTentStore } from '../../stores/tentStore';
import { loadSanctuaryData } from '../sanctuary/sanctuaryLoader';

export async function hydrateAuthenticatedUserData(): Promise<void> {
  loadSanctuaryData();

  await Promise.all([
    useCurrencyStore.getState().hydrate(),
    useSanctuaryStore.getState().hydrate(),
    useStreakStore.getState().fetchStreak(),
    useTentStore.getState().hydrate(),
  ]);
}

export function resetAuthenticatedUserData(): void {
  useCurrencyStore.getState().resetForAuthChange();
  useSanctuaryStore.getState().resetForAuthChange();
  useStreakStore.getState().resetForAuthChange();
  useTentStore.getState().resetForAuthChange();
}
