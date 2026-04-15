import { router } from 'expo-router';

export async function routeAfterAuth(): Promise<void> {
  router.replace('/');
}
