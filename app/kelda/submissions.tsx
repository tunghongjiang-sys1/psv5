import { View, Text, StyleSheet } from 'react-native';

export default function KeldaSubmissionsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Submissions</Text>
      <Text>
        Placeholder for list of students who submitted / did not submit and export PDF button.
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
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
  },
});