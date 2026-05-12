import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';

export default function KeldaLoginScreen() {
  const [code, setCode] = useState('');
  const router = useRouter();

  const handleUnlock = () => {
    if (!code.trim()) return;
    router.push('/kelda/dashboard');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter passcode to unlock</Text>
      <TextInput
        style={styles.input}
        placeholder="Passcode"
        secureTextEntry
        value={code}
        onChangeText={setCode}
      />
      <Button title="Unlock" onPress={handleUnlock} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
});