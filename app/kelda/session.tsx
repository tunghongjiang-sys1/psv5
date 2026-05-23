import { View, Text, StyleSheet } from 'react-native';

export default function KeldaSessionScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Session Settings</Text>
      <Text>Placeholder for starting new session, setting budget, and enabling tabs.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
  },
});