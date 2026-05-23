// app/student/interview.tsx
import { View, Text, StyleSheet } from 'react-native';

export default function StudentInterviewScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Interview / VR Map</Text>
      <Text style={styles.text}>
        Placeholder for LOOPIETOWN map and chat with elders.
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