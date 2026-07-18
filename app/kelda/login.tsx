
import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Mascot } from '../../components/parts';
import { teachpass, c } from '../../lib/helpers';
import { keldaState } from '../../lib/keldaState';

export default function TeacherLockScreen() {
  const [code, setCode] = useState('');
  const router = useRouter();
  const display = code.replace(/./g, '●');

  useEffect(() => {
    if (keldaState.get().isUnlocked) {
      const last = keldaState.getLastRoute();
      const dest =
        last && last !== '/kelda/login' && last.startsWith('/kelda/')
          ? last
          : '/kelda/dashboard';
      router.replace(dest as any);
    }
  }, [router]);

  const press = useCallback(
    (val: string) => {
      if (val === 'DEL') {
        setCode((p) => p.slice(0, -1));
        return;
      }
      if (code.length >= 6) return;
      const next = code + val;
      setCode(next);
      if (next.length >= 4) {
        if (next === teachpass) {
          keldaState.set({ isUnlocked: true });
          setTimeout(() => {
            const last = keldaState.getLastRoute();
            const dest =
              last && last !== '/kelda/login' && last.startsWith('/kelda/')
                ? last
                : '/kelda/dashboard';
            router.replace(dest as any);
          }, 200);
        } else {
          setTimeout(() => {
            Alert.alert('Wrong passcode');
            setCode('');
          }, 200);
        }
      }
    },
    [code, router]
  );

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['DEL', '0', '↵'],
  ];

  return (
    <SafeAreaView style={styles.root}>
      <Pressable onPress={() => router.replace('/')} style={styles.backbutton}>
        <Text style={styles.backtext}>← Back</Text>
      </Pressable>

      <View style={styles.container}>
        <Mascot size={80} />
        <Text style={styles.title}>Enter passcode to unlock</Text>
        <Text style={styles.subtitle}>If you aren't the teacher go away</Text>

        <Text style={styles.display}>{display || ' '}</Text>

        <View style={styles.keypad}>
          {keys.map((row, r) => (
            <View key={r} style={styles.row}>
              {row.map((k) => {
                const isDel = k === 'DEL';
                const isEnter = k === '↵';
                const buttonBg = isDel ? c.red : isEnter ? c.green : c.navyLight;

                return (
                  <Pressable
                    key={k}
                    onPress={() => press(k)}
                    style={({ pressed }) => [
                      styles.key,
                      { backgroundColor: buttonBg },
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    <Text style={styles.keytext}>{k}</Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: c.navy,
  },
  backbutton: {
    position: 'absolute',
    top: 56,
    left: 24,
    zIndex: 10,
    padding: 8,
  },
  backtext: {
    color: c.yellow,
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 22,
    color: c.white,
    marginTop: 16,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 18,
    color: c.navyLight,
    marginBottom: 16,
  },
  display: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 32,
    color: c.yellow,
    letterSpacing: 12,
    marginVertical: 24,
    minHeight: 40,
  },
  keypad: {
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  key: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  keytext: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 24,
    color: c.white,
  },
  passcodehint: {
    fontFamily: 'DMSans_400Regular',
    color: c.grey,
    fontSize: 12,
    marginTop: 24,
  },
});