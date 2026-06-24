// app/student/_layout.tsx
import React, { useEffect } from 'react';
import { Stack, usePathname, useRouter } from 'expo-router'; import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useStudentState } from '../../lib/students';
import { usefb, c } from '../../lib/helpers';
import { PsIcon } from '../../components/parts';

const tabs = [
  { key: 'interview', label: 'Interview', href: '/student/interview' },
  { key: 'shopping', label: 'Shopping', href: '/student/shopping' },
  { key: 'reflections', label: 'Reflections', href: '/student/reflections' },
  { key: 'summary', label: 'Submit', href: '/student/submit' },
];

export default function StudentLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const { studentId, sessionId } = useStudentState();

  const showTabBar = pathname !== '/student/name' && pathname !== '/student/groupings';

  // Read unlocks in real time
  const interviewUnlocked = usefb(sessionId ? `sessions/${sessionId}/unlocked/interview` : null);
  const shoppingUnlocked = usefb(sessionId ? `sessions/${sessionId}/unlocked/shopping` : null);
  const reflectionsUnlocked = usefb(sessionId ? `sessions/${sessionId}/unlocked/reflections` : null);
  const summaryUnlocked = usefb(sessionId ? `sessions/${sessionId}/unlocked/summary` : null);

  const getLockStatus = (key: string) => {
    switch (key) {
      case 'interview':
        return interviewUnlocked === true;
      case 'shopping':
        return shoppingUnlocked === true;
      case 'reflections':
        return reflectionsUnlocked === true;
      case 'summary':
        return summaryUnlocked === true;
      default:
        return false;
    }
  };

  const handleTabPress = (tab: typeof tabs[number]) => {
    const isUnlocked = getLockStatus(tab.key);
    if (!isUnlocked) {
      Alert.alert('Phase Locked', 'Your teacher has not unlocked this phase yet!');
      return;
    }
    router.replace(tab.href as any);
  };

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>

      {showTabBar && (
        <View style={styles.tabbar}>
          {tabs.map((tab) => {
            const active = pathname.startsWith(tab.href);
            const isUnlocked = getLockStatus(tab.key);

            return (
              <Pressable
                key={tab.href}
                onPress={() => handleTabPress(tab)}
                style={styles.tabbutton}
              >
                <View style={styles.tablabelrow}>
                  <Text
                    style={[
                      styles.tabtext,
                      active && styles.tabtextactive,
                      !isUnlocked && styles.tabtextlocked,
                    ]}
                  >
                    {tab.label}
                  </Text>
                  {!isUnlocked && <PsIcon name="padlock" size={13} />}
                </View>
                {active && <View style={styles.tabindicator} />}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: c.white,
  },
  content: {
    flex: 1,
  },
  tabbar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingVertical: 10,
    paddingHorizontal: 4,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  tabbutton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    justifyContent: 'center',
  },
  tabtext: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: c.grey,
  },
  tabtextactive: {
    color: c.navy,
    fontFamily: 'DMSans_700Bold',
  },
  tabtextlocked: {
    color: c.greyLight,
  },
  tablabelrow: {
    minHeight: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabindicator: {
    marginTop: 4,
    width: '40%',
    height: 3,
    borderRadius: 999,
    backgroundColor: c.navy,
  },
});
