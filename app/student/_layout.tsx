// app/student/_layout.tsx
import { Stack, Link, usePathname } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';

const tabs = [
  { label: 'Interview', href: '/student/interview' },
  { label: 'Shopping', href: '/student/shopping' },
  { label: 'Reflections', href: '/student/reflections' },
  { label: 'Submit', href: '/student/submit' },
];

export default function StudentLayout() {
  const pathname = usePathname();

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>

      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link key={tab.href} href={tab.href} asChild>
              <Pressable style={styles.tabButton}>
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {tab.label}
                </Text>
                {active && <View style={styles.tabIndicator} />}
              </Pressable>
            </Link>
          );
        })}
      </View>
    </View>
  );
}

const PRIMARY_BLUE = '#002169';
const GREY = '#7F7F7F';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#ffffff' },
  content: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingVertical: 6,
    paddingHorizontal: 4,
    backgroundColor: '#FFFFFF',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  tabText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: GREY,
  },
  tabTextActive: {
    color: PRIMARY_BLUE,
  },
  tabIndicator: {
    marginTop: 2,
    width: '60%',
    height: 3,
    borderRadius: 999,
    backgroundColor: PRIMARY_BLUE,
  },
});