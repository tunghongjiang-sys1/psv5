import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
} from 'react-native';
import {useRouter} from 'expo-router';
import {db, ref, update} from '../../lib/firebaseConfig';
import {usefb, fw, c} from '../../lib/helpers';
import {useStudentState} from '../../lib/students';
import {Wide, Btn, PsIcon} from '../../components/parts';
import {computeGroupAssignments} from '../../lib/groupAssignment';

type Phase = 'picking' | 'waiting' | 'assigned';

export default function StudentGroupingsScreen() {
  const router = useRouter();
  const {studentId, sessionId} = useStudentState();

  const [selected, setSelected] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>('picking');
  const [saving, setSaving] = useState(false);
  const [confirmedAt, setConfirmedAt] = useState<number | null>(null);
  const navigatedRef = useRef(false);

  useEffect(() => {
    if (!studentId || !sessionId) {
      router.replace('/student/name');
    }
  }, [studentId, sessionId, router]);

  useEffect(() => {
    if (phase === 'assigned' && confirmedAt && !navigatedRef.current) {
      navigatedRef.current = true;
      router.replace('/student/interview');
    }
  }, [phase, confirmedAt, router]);

  const studentsData = usefb(sessionId ? `sessions/${sessionId}/students` : null);
  const forceAssignGroupings = usefb(
    sessionId ? `sessions/${sessionId}/forceAssignGroupings` : null,
  );
  const finalizedGroups = usefb(sessionId ? `sessions/${sessionId}/groupAssignments` : null);

  const allStudents = useMemo(() => {
    if (!studentsData) return [];
    return Object.values(studentsData ?? {}).map((s: any) => ({
      id: s?.id,
      name: s?.name || s?.id,
    }));
  }, [studentsData]);

  const peers = useMemo(
    () => allStudents.filter((s) => s.id !== studentId),
    [allStudents, studentId],
  );

  const allSubmitted = useMemo(() => {
    if (!studentsData) return false;
    const records = Object.values(studentsData ?? {}).filter((s: any) => s != null);
    if (records.length === 0) return false;
    return records.every((s: any) => s.groupingsSubmitted === true);
  }, [studentsData]);

  const triggerReady = !!studentsData && (allSubmitted || forceAssignGroupings === true);

  const myGroupInfo = useMemo<{
    memberIds: string[];
    memberNames: string[];
    groupNumber: number;
    totalGroups: number;
    isFinalized: boolean;
  } | null>(() => {
    if (!studentId) return null;

    if (finalizedGroups && Array.isArray(finalizedGroups) && finalizedGroups.length > 0) {
      for (let i = 0; i < finalizedGroups.length; i++) {
        const g: any = finalizedGroups[i];
        if (Array.isArray(g?.memberIds) && g.memberIds.includes(studentId)) {
          return {
            memberIds: g.memberIds,
            memberNames: Array.isArray(g.memberNames) ? g.memberNames : [],
            groupNumber: g.groupNumber ?? i + 1,
            totalGroups: finalizedGroups.length,
            isFinalized: true,
          };
        }
      }
      return null;
    }

    if (!triggerReady || !studentsData) return null;
    const ids = Object.keys(studentsData);
    if (ids.length < 2) return null;

    const preferMap: Record<string, string[]> = {};
    for (const id of ids) {
      const rec = studentsData?.[id] ?? {};
      const picks = Array.isArray(rec.preferredGroup) ? rec.preferredGroup : [];
      preferMap[id] = picks.filter((p: string) => ids.includes(p) && p !== id);
    }

    const groups = computeGroupAssignments(allStudents, preferMap, sessionId!, {
      minSize: 3,
      maxSize: 5,
    });
    const idx = groups.findIndex((g) => g.memberIds.includes(studentId));
    if (idx < 0) return null;
    return {
      memberIds: groups[idx].memberIds,
      memberNames: groups[idx].memberNames,
      groupNumber: idx + 1,
      totalGroups: groups.length,
      isFinalized: false,
    };
  }, [finalizedGroups, studentsData, studentId, triggerReady, allStudents, sessionId]);

  const soloReady =
    !!triggerReady &&
    !!studentsData &&
    Object.keys(studentsData).length === 1 &&
    Object.keys(studentsData)[0] === studentId;

  const studentInFinalized = useMemo(() => {
    if (!studentId) return false;
    if (!Array.isArray(finalizedGroups) || finalizedGroups.length === 0) return false;
    return finalizedGroups.some(
      (g: any) => Array.isArray(g?.memberIds) && g.memberIds.includes(studentId),
    );
  }, [finalizedGroups, studentId]);

  const studentStranded =
    Array.isArray(finalizedGroups) && finalizedGroups.length > 0 && !studentInFinalized;

  const lateArrival =
    forceAssignGroupings === true &&
    Array.isArray(finalizedGroups) &&
    finalizedGroups.length > 0;

  const submittedCount = useMemo(() => {
    if (!studentsData) return 0;
    return Object.values(studentsData ?? {}).filter(
      (s: any) => s != null && s.groupingsSubmitted === true,
    ).length;
  }, [studentsData]);
  const totalCount = allStudents.length;

  useEffect(() => {
    if (phase === 'assigned') return;
    if (phase === 'waiting') {
      const hasRealGroup = myGroupInfo !== null && myGroupInfo.memberIds.length > 0;
      if (triggerReady && (hasRealGroup || soloReady)) {
        setPhase('assigned');
      }
      return;
    }
  }, [phase, triggerReady, myGroupInfo, soloReady]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= 5) {
        Alert.alert('Maximum group size reached', 'You can select up to 5 group members.');
        return prev;
      }
      return [...prev, id];
    });
  }, []);

  const handleGo = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const ids = Object.keys(studentsData ?? {});
      const preferMap: Record<string, string[]> = {};
      for (const id of ids) {
        const rec = studentsData?.[id] ?? {};
        const picks =
          id === studentId
            ? selected
            : Array.isArray(rec.preferredGroup)
            ? rec.preferredGroup
            : [];
        preferMap[id] = picks.filter((p: string) => ids.includes(p) && p !== id);
      }
      const groups = computeGroupAssignments(allStudents, preferMap, sessionId!, {
        minSize: 3,
        maxSize: 5,
      });
      const writePayload: Record<string, any> = {
        [`students/${studentId}/preferredGroup`]: selected,
        [`students/${studentId}/groupingsSubmitted`]: true,
        [`students/${studentId}/submittedAt`]: Date.now(),
      };
      const lateArrival =
        forceAssignGroupings === true &&
        Array.isArray(finalizedGroups) &&
        finalizedGroups.length > 0;
      if (lateArrival) {
        writePayload.groupAssignments = groups.map((g, idx) => ({
          groupNumber: idx + 1,
          memberIds: g.memberIds,
          memberNames: g.memberNames,
        }));
        writePayload.forceAssignGroupings = true;
      }
      await fw(update(ref(db, `sessions/${sessionId}`), writePayload));
      setPhase('waiting');
    } catch (e: any) {
      Alert.alert('Error', e.message);
      setSaving(false);
    }
  };

  const handleConfirm = async () => {
    try {
      await fw(
        update(ref(db, `sessions/${sessionId}/students/${studentId}`), {
          viewedAssignment: true,
          viewedAt: Date.now(),
          assignedGroup: myGroupInfo?.memberIds ?? [studentId],
        }),
      );
      setConfirmedAt(Date.now());
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView style={{flex: 1}} contentContainerStyle={styles.scrollcontent}>
        <Wide style={{alignItems: 'center'}}>
          {phase === 'picking' && (
            <>
              <Text style={styles.heading}>
                Choose the students whom you would like to be in a group with!
              </Text>
              <Text style={styles.subtitle}>Selected: {selected.length} / 5 members</Text>

              <View style={styles.studentgrid}>
                {peers.map((s) => {
                  const sel = selected.includes(s.id);
                  const atLimit = selected.length >= 5 && !sel;
                  const bgColor = sel ? c.teal : atLimit ? c.greyLight : c.greyDark;
                  const textColor = sel ? c.navy : atLimit ? c.grey : c.white;
                  return (
                    <Pressable
                      key={s.id}
                      onPress={() => toggle(s.id)}
                      style={[styles.studentcard, {backgroundColor: bgColor}]}
                      disabled={atLimit}
                    >
                      <Text style={[styles.studentname, {color: textColor}]}>{s.name}</Text>
                    </Pressable>
                  );
                })}

                {peers.length === 0 && (
                  <Text style={styles.waitingtext}>Waiting for others to join...</Text>
                )}
              </View>

              {lateArrival && (
                <Text style={styles.syncHint}>
                  You're joining late — submitting will re-run the grouping for everyone.
                </Text>
              )}

              {saving ? (
                <ActivityIndicator color={c.teal} size="large" />
              ) : (
                <Btn label="Start" onPress={handleGo} />
              )}
            </>
          )}

          {phase === 'waiting' && studentStranded && (
            <View style={styles.waitingcontainer}>
              <Text style={styles.strandedtitle}>Not yet in any group</Text>
              <Text style={styles.strandedsub}>
                Your teacher has saved the groupings but didn't include you yet. Please ask them to
                add you, then refresh.
              </Text>
            </View>
          )}

          {phase === 'waiting' && !studentStranded && (
            <View style={styles.waitingcontainer}>
              <ActivityIndicator color={c.teal} size="large" />
              <Text style={styles.waitingsubtitle}>Waiting for everyone to choose groups…</Text>
              <Text style={styles.waitingcount}>
                {submittedCount} / {totalCount} submitted
              </Text>
              {forceAssignGroupings === true && (
                <Text style={styles.forcednote}>Your teacher has approved the groupings ✓</Text>
              )}
            </View>
          )}

          {phase === 'assigned' && (myGroupInfo || soloReady) && (
            <View style={styles.assignedcontainer}>
              {myGroupInfo && myGroupInfo.totalGroups > 0 && (
                <View style={styles.groupnumberbadge}>
                  <Text style={styles.groupnumbertext}>
                    Group {myGroupInfo.groupNumber} of {myGroupInfo.totalGroups}
                    {myGroupInfo.isFinalized ? ' · finalized by teacher' : ''}
                  </Text>
                </View>
              )}
              <View style={styles.confettiheader}>
                <PsIcon name="complete" size={28} />
                <Text style={styles.confettititle}>
                  {soloReady ? 'Ready to Begin!' : 'Your Group is Set!'}
                </Text>
              </View>
              <Text style={styles.confettisubtitle}>
                {soloReady
                  ? "You're the only student in this session — you can proceed to the Interview phase."
                  : 'These will be your teammates for the rest of the session.'}
              </Text>

              {myGroupInfo && !soloReady && (
                <View style={styles.groupcard}>
                  {myGroupInfo.memberNames.map((nm, i) => {
                    const isSelf = myGroupInfo.memberIds[i] === studentId;
                    return (
                      <View key={i} style={styles.memberrow}>
                        <View
                          style={[
                            styles.memberavatar,
                            {
                              backgroundColor: isSelf ? c.purple : c.teal,
                            },
                          ]}
                        >
                          <Text style={styles.memberavatarsingle}>
                            {nm.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.membername,
                            isSelf && {
                              color: c.purple,
                              fontFamily: 'DMSans_700Bold',
                            },
                          ]}
                        >
                          {isSelf ? `${nm} (you)` : nm}
                        </Text>
                      </View>
                    );
                  })}
                  <View style={styles.memberfooter}>
                    <Text style={styles.memberfootertext}>
                      {myGroupInfo.memberIds.length === 1
                        ? 'Group of 1'
                        : `Group of ${myGroupInfo.memberIds.length}`}
                    </Text>
                  </View>
                </View>
              )}

              <View style={{marginTop: 24, alignSelf: 'stretch'}}>
                <Btn
                  label="OK, Continue to Interview →"
                  onPress={handleConfirm}
                  color={c.yellow}
                  textColor={c.navy}
                />
              </View>
            </View>
          )}
        </Wide>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: c.white,
  },
  scrollcontent: {
    padding: 32,
  },
  heading: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 22,
    color: c.navy,
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 16,
  },
  subtitle: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: c.grey,
    textAlign: 'center',
    marginBottom: 24,
  },
  studentgrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 32,
    width: '100%',
  },
  studentcard: {
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 16,
    margin: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  studentname: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 18,
  },
  waitingtext: {
    fontFamily: 'DMSans_400Regular',
    color: c.grey,
    fontSize: 14,
    marginTop: 16,
  },
  syncHint: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: c.orange,
    textAlign: 'center',
    marginBottom: 12,
    marginTop: 16,
    paddingHorizontal: 8,
  },
  waitingcontainer: {
    alignItems: 'center',
    gap: 12,
    marginTop: 40,
  },
  waitingsubtitle: {
    fontFamily: 'DMSans_700Bold',
    color: c.navy,
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  waitingcount: {
    fontFamily: 'DMSans_500Medium',
    color: c.grey,
    fontSize: 13,
  },
  forcednote: {
    fontFamily: 'DMSans_500Medium',
    color: c.green,
    fontSize: 13,
    marginTop: 6,
  },
  strandedtitle: {
    fontFamily: 'DMSans_700Bold',
    color: c.orange,
    fontSize: 18,
    textAlign: 'center',
  },
  strandedsub: {
    fontFamily: 'DMSans_500Medium',
    color: c.grey,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
  },
  assignedcontainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 24,
  },
  groupnumberbadge: {
    alignSelf: 'center',
    backgroundColor: c.navy,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  groupnumbertext: {
    color: c.white,
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  confettiheader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  confettititle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 26,
    color: c.navy,
  },
  confettisubtitle: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: c.grey,
    textAlign: 'center',
    marginBottom: 22,
  },
  groupcard: {
    width: '100%',
    backgroundColor: c.offWhite,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  memberrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eef0f4',
  },
  memberavatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberavatarsingle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    color: c.white,
  },
  membername: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 16,
    color: c.navy,
  },
  memberfooter: {
    paddingTop: 8,
    alignItems: 'flex-end',
  },
  memberfootertext: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: c.grey,
  },
});
