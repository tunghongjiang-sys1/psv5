// app/student/name.tsx
import { View, Text, TextInput, Pressable, StyleSheet, Image } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { auth, db } from '../../lib/firebaseConfig';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const SESSION_ID = 'default-session'; // later we'll get this from Kelda

export default function StudentNameScreen() {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleGo = async () => {
    const trimmed = name.trim();
    if (!trimmed || !auth.currentUser) return;

    try {
      setSaving(true);
      const uid = auth.currentUser.uid;

      await setDoc(
        doc(db, 'students', uid),
        {
          name: trimmed,
          currentSessionId: SESSION_ID,
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      router.push('/student/groupings');
    } catch (error) {
      console.error('Error saving student name', error);
    } finally {
      setSaving(false);
    }
  };

  const disabled = !name.trim() || saving;

  return (
    <View style={styles.root}>
      <View style={styles.centerRow}>
        <View style={styles.card}>
          <Text style={styles.heading}>Type in your name to start!</Text>

          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor="#7F7F7F"
            value={name}
            onChangeText={setName}
          />

          <Pressable
            onPress={handleGo}
            style={({ pressed }) => [
              styles.button,
              disabled && styles.buttonDisabled,
              pressed && !disabled && styles.buttonPressed,
            ]}
            disabled={disabled}
          >
            <Text style={styles.buttonText}>{saving ? 'Saving…' : 'Go'}</Text>
          </Pressable>
        </View>

        <Image
          source={require('../../assets/mascot.png')}
          style={styles.mascot}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

const PRIMARY_BLUE = '#002169';
const PRIMARY_ORANGE = '#FF5100';
const LIGHT_GREY = '#F2F2F2';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PRIMARY_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  centerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 1000,
    width: '100%',
  },
  card: {
    flexShrink: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingVertical: 36,
    paddingHorizontal: 32,
    maxWidth: 540,
    elevation: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  heading: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 26,
    color: PRIMARY_BLUE,
    marginBottom: 24,
  },
  input: {
    fontFamily: 'DMSans_400Regular',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#7F7F7F',
    backgroundColor: LIGHT_GREY,
    paddingHorizontal: 22,
    paddingVertical: 12,
    fontSize: 18,
    marginBottom: 24,
  },
  button: {
    borderRadius: 999,
    backgroundColor: PRIMARY_ORANGE,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    backgroundColor: '#FFB38A',
  },
  buttonText: {
    fontFamily: 'DMSans_700Bold',
    color: '#FFFFFF',
    fontSize: 20,
  },
  mascot: {
    width: 200,
    height: 200,
    marginLeft: 40,
  },
});