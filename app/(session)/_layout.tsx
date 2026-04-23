import { Stack } from 'expo-router';

export default function SessionLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: '#0A0A0B' },
        freezeOnBlur: true,
      }}
    />
  );
}
