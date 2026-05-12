import { View, Text, StyleSheet } from 'react-native';

export default function StudentMapScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>LOOPIETOWN Map</Text>
      <Text>VR world placeholder (NPCs will go here).</Text>
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