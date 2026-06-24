// app/_layout.tsx
import { Stack } from 'expo-router'; import { View, ActivityIndicator } from 'react-native';
import { useAnonymousAuth } from '../lib/useAnonymousAuth';
import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';

export default function RootLayout() {
  const { user, loading: authLoading } = useAnonymousAuth();
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  const loading = authLoading || !fontsLoaded;

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}