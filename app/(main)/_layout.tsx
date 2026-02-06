import { Stack } from 'expo-router';

export default function MainLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0A0A0B' },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="home" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="mixer" />
      <Stack.Screen name="modes" />
    </Stack>
  );
}
