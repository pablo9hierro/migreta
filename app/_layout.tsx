import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#0D1117' },
          headerTintColor: '#E6EDF3',
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: '#0D1117' },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="history" options={{ title: 'Histórico' }} />
      </Stack>
    </>
  );
}
