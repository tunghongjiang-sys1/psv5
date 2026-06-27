// app/student/name.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, SafeAreaView, ActivityIndicator, Alert, Image, useWindowDimensions, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ref, set } from 'firebase/database';
import { db } from '../../lib/firebaseConfig';
import { usefb, fw, c } from '../../lib/helpers';
import { studentState } from '../../lib/students';

export default function StudentEntryScreen() {
  const [name, setName] = useState('');
  const [nameWarning, setNameWarning] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { width } = useWindowDimensions();

  const activeSession = usefb('activeSession');
  const studentsData = usefb(
    activeSession?.id ? `sessions/${activeSession.id}/students` : null
  );

  if (activeSession === undefined) {
    return (
      <View style={styles.loadingroot}>
        <ActivityIndicator color={c.navy} size="large" />
      </View>
    );
  }

  // If there is no active session or status is not 'active'
  if (!activeSession || activeSession.status !== 'active') {
    return (
      <SafeAreaView style={styles.waitingroot}>
        <Pressable onPress={() => router.replace('/')} style={styles.backbutton}>
          <Text style={styles.backbuttontext}>← Back</Text>
        </Pressable>
        <Image
          source={require('../../assets/mascot.png')}
          style={styles.mascotlarge}
          resizeMode="contain"
        />
        <Text style={styles.waitingtitle}>LOOPIE{'\n'}TOWN</Text>
        <Text style={styles.waitingtext}>
          Wait for a new session to begin!
        </Text>
        <ActivityIndicator color={c.navy} style={{ marginTop: 24 }} size="large" />
      </SafeAreaView>
    );
  }

  const handleGo = async () => {
    const trimmed = name.trim();
    setNameWarning('');
    if (!trimmed) {
      Alert.alert('Enter your name!');
      return;
    }
    if (loading) return;

    // Check if name is taken
    const existing = studentsData ? Object.values(studentsData) : [];
    const taken = existing.some(
      (s: any) => s.name?.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (taken) {
      setNameWarning('This name has already been taken.');
      return;
    }

    setLoading(true);
    try {
      const sid = trimmed.replace(/\s+/g, '_') + '_' + Date.now();
      await fw(
        set(ref(db, `sessions/${activeSession.id}/students/${sid}`), {
          name: trimmed,
          id: sid,
          joinedAt: Date.now(),
          preferredGroup: [],
          bought: {},
          borrowed: {},
          chats: {},
          reflection: '',
          submitted: false,
        })
      );

      // Save student state globally
      studentState.set({
        studentId: sid,
        sessionId: activeSession.id,
        studentName: trimmed,
      });

      router.replace('/student/groupings');
    } catch (e: any) {
      Alert.alert('Error', e.message);
      setLoading(false);
    }
  };

  const isWide = width >= 600;

  return (
    <SafeAreaView style={styles.root}>
      {/* Header bar */}
      <View style={styles.navbar}>
        <Pressable onPress={() => router.replace('/')} style={styles.navbarback}>
          <Text style={styles.navbarbacktext}>← Back</Text>
        </Pressable>
        <Text style={styles.navbartitle}>Join Session</Text>
      </View>

      <View style={styles.container}>
        <View style={[styles.contentrow, { flexDirection: isWide ? 'row' : 'column' }]}>
          <View style={styles.formcard}>
            <Text style={styles.cardheading}>Type in your name to start!</Text>
            <TextInput
              style={[styles.textinput, !!nameWarning && styles.textinputwarning]}
              value={name}
              onChangeText={(nextName) => {
                setName(nextName);
                if (nameWarning) setNameWarning('');
              }}
              placeholder="Your name..."
              placeholderTextColor={c.greyLight}
              onSubmitEditing={handleGo}
              editable={!loading}
            />
            <View style={styles.warningrow}>
              {!!nameWarning && (
                <Text style={styles.warningtext}>{nameWarning}</Text>
              )}
            </View>
            {loading ? (
              <ActivityIndicator color={c.navy} size="large" style={{ alignSelf: 'flex-start' }} />
            ) : (
              <Pressable
                onPress={handleGo}
                style={({ pressed }) => [
                  styles.gobutton,
                  pressed && styles.gobuttonpressed,
                ]}
              >
                <Text style={styles.gobuttontext}>Go →</Text>
              </Pressable>
            )}
          </View>
          <View style={styles.mascotcontainer}>
            <Image
              source={require('../../assets/mascot.png')}
              style={{ width: isWide ? 160 : 100, height: (isWide ? 160 : 100) * 1.25 }}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingroot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.teal,
  },
  waitingroot: {
    flex: 1,
    backgroundColor: c.teal,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  backbutton: {
    position: 'absolute',
    top: 56,
    left: 24,
  },
  backbuttontext: {
    color: c.navy,
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
  },
  mascotlarge: {
    width: 100,
    height: 125,
  },
  waitingtitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 48,
    color: c.pink,
    textAlign: 'center',
    lineHeight: 52,
    marginTop: 16,
  },
  waitingtext: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 20,
    color: c.navy,
    textAlign: 'center',
    marginTop: 12,
  },
  root: {
    flex: 1,
    backgroundColor: c.white,
  },
  navbar: {
    backgroundColor: c.navy,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navbarback: {
    marginRight: 8,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  navbarbacktext: {
    color: c.yellow,
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
  },
  navbartitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 20,
    color: c.white,
    flex: 1,
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 860,
    alignSelf: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  contentrow: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  formcard: {
    flex: 1,
    padding: 32,
    width: '100%',
  },
  cardheading: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 24,
    color: c.navy,
    marginBottom: 28,
  },
  textinput: {
    borderBottomWidth: 2,
    borderBottomColor: c.teal,
    fontSize: 22,
    fontFamily: 'DMSans_500Medium',
    color: c.navy,
    paddingVertical: 8,
    marginBottom: 8,
    width: '100%',
    maxWidth: 320,
  },
  textinputwarning: {
    borderBottomColor: c.red,
  },
  warningtext: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
    color: c.red,
    width: '100%',
    maxWidth: 320,
  },
  warningrow: {
    minHeight: 18,
    marginBottom: 10,
  },
  gobutton: {
    backgroundColor: c.yellow,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 50,
    alignItems: 'center',
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },
  gobuttonpressed: {
    opacity: 0.85,
  },
  gobuttontext: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 17,
    color: c.navy,
  },
  mascotcontainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
