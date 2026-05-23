import { View, Text, StyleSheet } from 'react-native';

export default function StudentReflectionsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reflections</Text>
      <Text style={styles.text}>
        Placeholder for reflection question and view of fellow students&apos; reflections.
      </Text>
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
    fontFamily: 'DMSans_700Bold',
    fontSize: 24,
    marginBottom: 8,
  },
  text: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
  },
});