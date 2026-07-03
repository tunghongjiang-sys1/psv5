
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image, Pressable, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';

const c = {
  teal: '#4ECDC4',
  navy: '#1A1F5E',
  yellow: '#FFD60A',
  pink: '#FF4785',
  white: '#FFFFFF',
};

export default function WelcomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const wide = width >= 600;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('../assets/mascot.png')}
          style={{ width: wide ? 130 : 110, height: (wide ? 130 : 110) * 1.25 }}
          resizeMode="contain"
        />
        <Text style={[styles.title, { fontSize: wide ? 64 : 56, lineHeight: wide ? 68 : 60 }]}>LOOPIE TOWN</Text>
        <Text style={styles.subtitle}>From Ideas to Impact</Text>
        <View style={styles.buttoncontainer}>
          <Pressable
            onPress={() => router.push('/student/name')}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: c.navy },
              pressed && styles.buttonpressed,
            ]}
          >
            <Text style={[styles.buttontext, { color: c.white }]}>I'm a Student</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/kelda/login')}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: c.yellow },
              pressed && styles.buttonpressed,
            ]}
          >
            <Text style={[styles.buttontext, { color: c.navy }]}>I'm a Teacher</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.teal,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    fontFamily: 'DMSans_700Bold',
    color: c.pink,
    textAlign: 'center',
    marginTop: 12,
  },
  subtitle: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 15,
    color: c.navy,
    marginBottom: 48,
    marginTop: 8,
  },
  buttoncontainer: {
    width: '100%',
    maxWidth: 400,
    gap: 16,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 50,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonpressed: {
    opacity: 0.85,
  },
  buttontext: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 17,
  },
});