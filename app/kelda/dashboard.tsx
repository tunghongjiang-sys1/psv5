import { View, Text, StyleSheet } from 'react-native';

export default function KeldaDashboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kelda Dashboard</Text>
      <Text>Here you will start sessions and export reflections.</Text>
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