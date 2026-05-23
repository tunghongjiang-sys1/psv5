import { View, Text, StyleSheet } from 'react-native';

export default function StudentSubmitScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Submit</Text>
      <Text style={styles.text}>
        Placeholder for summary screen before final submission to Kelda.
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