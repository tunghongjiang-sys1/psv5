import React, {useEffect, useMemo} from 'react';
import {Stack, usePathname, useRouter} from 'expo-router';
import {View, Text, StyleSheet, Pressable, Alert} from 'react-native';
import {useStudentState, studentState} from '../../lib/students';
import {usefb, c} from '../../lib/helpers';
import {ProgressBar, progressSteps, PsIcon} from '../../components/parts';

const tabs = [
  {key: 'interview', label: 'Interview', href: '/student/interview'},
  {key: 'shopping', label: 'Plan Logistics', href: '/student/shopping'},
  {key: 'reflections', label: 'Reflections', href: '/student/reflections'},
  {key: 'whiteboard', label: 'Whiteboard', href: '/student/whiteboard'},
  {key: 'summary', label: 'Summary', href: '/student/submit'},
];

function stepIndexForPath(pathname: string): number {
  if (pathname.endsWith('/student/groupings')) return 0;
  if (pathname.startsWith('/student/interview')) return 1;
  if (pathname.startsWith('/student/shopping')) return 2;
  if (pathname.startsWith('/student/reflections')) return 3;
  if (pathname.startsWith('/student/whiteboard')) return 4;
  if (pathname.startsWith('/student/submit')) return 5;
  return -1;
}

export default function StudentLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const {studentId, sessionId} = useStudentState();

  useEffect(() => {
    if (pathname && pathname.startsWith('/student/')) {
      studentState.setLastRoute(pathname);
    }
  }, [pathname]);

  const showTabBar = pathname !== '/student/name' && pathname !== '/student/groupings';
  const showProgressBar = pathname !== '/student/name';

  const interviewUnlocked = usefb(sessionId ? `sessions/${sessionId}/unlocked/interview` : null);
  const shoppingUnlocked = usefb(sessionId ? `sessions/${sessionId}/unlocked/shopping` : null);
  const reflectionsUnlocked = usefb(
    sessionId ? `sessions/${sessionId}/unlocked/reflections` : null,
  );
  const summaryUnlocked = usefb(sessionId ? `sessions/${sessionId}/unlocked/summary` : null);
  const forceAssignGroupings = usefb(
    sessionId ? `sessions/${sessionId}/forceAssignGroupings` : null,
  );
  const studentRecord = usefb(
    sessionId && studentId ? `sessions/${sessionId}/students/${studentId}` : null,
  );

  const {unlocked, completed} = useMemo(() => {
    const u = new Array(progressSteps.length).fill(false) as boolean[];
    const c = new Array(progressSteps.length).fill(false) as boolean[];

    u[0] = true;

    c[0] = studentRecord?.viewedAssignment === true || forceAssignGroupings === true;

    u[1] =
      interviewUnlocked === true ||
      forceAssignGroupings === true ||
      studentRecord?.viewedAssignment === true;

    u[2] = shoppingUnlocked === true;
    u[3] = reflectionsUnlocked === true;
    u[4] = reflectionsUnlocked === true || summaryUnlocked === true;
    u[5] = summaryUnlocked === true;

    c[1] = studentRecord?.allInterviewsCompleted === true;
    c[2] = !!studentRecord?.bought || !!studentRecord?.borrowed;
    c[3] = !!studentRecord?.reflections && Object.keys(studentRecord.reflections).length > 0;
    c[4] = !!studentRecord?.whiteboardStrokes || !!studentRecord?.whiteboardNotes;
    c[5] = studentRecord?.submitted === true;

    return {unlocked: u, completed: c};
  }, [
    interviewUnlocked,
    shoppingUnlocked,
    reflectionsUnlocked,
    summaryUnlocked,
    forceAssignGroupings,
    studentRecord,
  ]);

  const getLockStatus = (key: string) => {
    switch (key) {
      case 'interview':
        return unlocked[1];
      case 'shopping':
        return unlocked[2];
      case 'reflections':
        return unlocked[3];
      case 'whiteboard':
        return unlocked[4];
      case 'summary':
        return unlocked[5];
      default:
        return false;
    }
  };

  const handleTabPress = (tab: (typeof tabs)[number]) => {
    const isUnlocked = getLockStatus(tab.key);
    if (!isUnlocked) {
      Alert.alert('Phase Locked', 'Your teacher has not unlocked this phase yet!');
      return;
    }
    router.replace(tab.href as any);
  };

  const activeStepIndex = stepIndexForPath(pathname);

  return (
    <View style={styles.root}>
      {showProgressBar && activeStepIndex >= 0 && (
        <ProgressBar activeIndex={activeStepIndex} unlocked={unlocked} completed={completed} />
      )}

      <View style={styles.content}>
        <Stack screenOptions={{headerShown: false}} />
      </View>

      {showTabBar && (
        <View style={styles.tabbar}>
          {tabs.map((tab, idx) => {
            const active = pathname.startsWith(tab.href);
            const isUnlocked = unlocked[idx + 1];

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
    shadowOffset: {width: 0, height: -2},
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
