// app/index.tsx
import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Project Serve</Text>

      <Link href="/student/name" style={styles.linkText}>
        Go to Student Experience
      </Link>

      <Link href="/kelda/login" style={styles.linkText}>
        Kelda Admin
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 32,
  },
  linkText: {
    fontSize: 18,
    color: '#1e40af',
    marginVertical: 8,
  },
});