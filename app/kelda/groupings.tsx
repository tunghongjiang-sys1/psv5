import React, {useState, useMemo, useEffect, useRef, useCallback} from 'react';
import {View,Text,StyleSheet,SafeAreaView,ScrollView,ActivityIndicator,Pressable,Modal,} from 'react-native';
import {useRouter} from 'expo-router';
import {db, ref, update} from '../../lib/firebaseConfig';
import {usefb, fw, c} from '../../lib/helpers';
import {Wide, Btn, PsIcon} from '../../components/parts';
import {useKeldaState} from '../../lib/keldaState';
import {computeGroupAssignments} from '../../lib/groupAssignment';

type StudentInfo = {id: string; name: string};
type GroupInfo = {memberIds: string[]; memberNames: string[]};
type EditState = {groups: GroupInfo[]; unassigned: StudentInfo[]};

export default function KeldaGroupingsScreen() {
  const router = useRouter();
  const {isUnlocked} = useKeldaState();

  useEffect(() => {
    if (!isUnlocked) {
      router.replace('/kelda/login');
    }
  }, [isUnlocked, router]);

  const activeSession = usefb('activeSession');
  const sessionId = activeSession?.id;
  const studentsData = usefb(sessionId ? `sessions/${sessionId}/students` : null);
  const finalizedGroups = usefb(sessionId ? `sessions/${sessionId}/groupAssignments` : null);

  const allStudents = useMemo((): StudentInfo[] => {
    if (!studentsData) return [];
    return Object.values(studentsData ?? {}).map((s: any) => ({
      id: s?.id,
      name: s?.name || s?.id,
    }));
  }, [studentsData]);

  const computedGroups: GroupInfo[] = useMemo(() => {
    if (!studentsData || !sessionId || allStudents.length === 0) return [];
    const ids = Object.keys(studentsData);
    const preferMap: Record<string, string[]> = {};
    for (const id of ids) {
      const rec = studentsData[id] || {};
      const picks = Array.isArray(rec.preferredGroup) ? rec.preferredGroup : [];
      preferMap[id] = picks.filter((p: string) => ids.includes(p) && p !== id);
    }
    return computeGroupAssignments(allStudents, preferMap, sessionId, {minSize: 3, maxSize: 5});
  }, [studentsData, allStudents, sessionId]);

  const [editState, setEditState] = useState<EditState>({groups: [], unassigned: []});
  const [dirty, setDirty] = useState(false);
  const [baseline, setBaseline] = useState<EditState | null>(null);
  const [movePicker, setMovePicker] = useState<{
    studentId: string;
    studentName: string;
    currentGroupIdx: number;
  } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const baselineCapturedRef = useRef(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (dirty) return;
    const source = finalizedGroups;
    let initialGroups: GroupInfo[];
    if (source && Array.isArray(source) && source.length > 0) {
      initialGroups = source.map((g: any) => ({
        memberIds: Array.isArray(g.memberIds) ? g.memberIds : [],
        memberNames: Array.isArray(g.memberNames) ? g.memberNames : [],
      }));
    } else {
      initialGroups = computedGroups;
    }
    const assignedIds = new Set(initialGroups.flatMap((g) => g.memberIds));
    const unassigned = allStudents.filter((s) => !assignedIds.has(s.id));
    const next = {groups: initialGroups, unassigned};
    setEditState(next);
    if (!baselineCapturedRef.current) {
      baselineCapturedRef.current = true;
      setBaseline(next);
    }
  }, [finalizedGroups, computedGroups, allStudents, dirty]);

  const showToast = useCallback((message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const handleAutoAssign = () => {
    if (computedGroups.length === 0) {
      showToast('Nothing to auto-assign yet');
      return;
    }
    setDirty(true);
    setEditState({
      groups: computedGroups.map((g) => ({
        memberIds: [...g.memberIds],
        memberNames: [...g.memberNames],
      })),
      unassigned: [],
    });
    showToast(`Auto-assigned ${allStudents.length} students into ${computedGroups.length} groups`);
  };

  const handleMove = (studentId: string, currentGroupIdx: number) => {
    let studentName = '';
    if (currentGroupIdx === -1) {
      const s = editState.unassigned.find((x) => x.id === studentId);
      studentName = s?.name ?? studentId;
    } else {
      const g = editState.groups[currentGroupIdx];
      const i = g?.memberIds.indexOf(studentId) ?? -1;
      studentName = i >= 0 && g ? g.memberNames[i] : studentId;
    }
    setMovePicker({studentId, studentName, currentGroupIdx});
  };

  const doMove = (studentId: string, currentGroupIdx: number, targetGroupIdx: number) => {
    setDirty(true);
    setEditState((prev) => {
      let studentName = '';
      const newGroups = prev.groups.map((g, idx) => {
        if (idx !== currentGroupIdx) return g;
        const i = g.memberIds.indexOf(studentId);
        if (i < 0) return g;
        studentName = g.memberNames[i] ?? '';
        return {
          memberIds: g.memberIds.filter((_, j) => j !== i),
          memberNames: g.memberNames.filter((_, j) => j !== i),
        };
      });
      const newUnassigned = prev.unassigned.filter((s) => {
        if (s.id === studentId) {
          studentName = s.name;
          return false;
        }
        return true;
      });

      if (targetGroupIdx === -1) {
        return {
          groups: newGroups,
          unassigned: [...newUnassigned, {id: studentId, name: studentName}],
        };
      }
      newGroups[targetGroupIdx] = {
        memberIds: [...newGroups[targetGroupIdx].memberIds, studentId],
        memberNames: [...newGroups[targetGroupIdx].memberNames, studentName],
      };
      return {groups: newGroups, unassigned: newUnassigned};
    });
  };

  const handleAddGroup = () => {
    const maxGroups = Math.max(2, Math.ceil(allStudents.length / 3) + 1);
    if (editState.groups.length >= maxGroups) {
      showToast(`Maximum ${maxGroups} groups reached`);
      return;
    }
    setDirty(true);
    setEditState((prev) => ({
      groups: [...prev.groups, {memberIds: [], memberNames: []}],
      unassigned: prev.unassigned,
    }));
    showToast(`Added Group ${editState.groups.length + 1}`);
  };

  const handleRemoveGroup = (idx: number) => {
    const removed = editState.groups[idx];
    const returnedCount = removed?.memberIds.length ?? 0;
    setDirty(true);
    setEditState((prev) => {
      if (!prev.groups[idx]) return prev;
      const newGroups = prev.groups.filter((_, i) => i !== idx);
      const newUnassigned = [
        ...prev.unassigned,
        ...(removed?.memberIds.map((id, i) => ({id, name: removed.memberNames[i] ?? id})) ?? []),
      ];
      return {groups: newGroups, unassigned: newUnassigned};
    });
    showToast(
      returnedCount > 0
        ? `Removed Group ${idx + 1} (${returnedCount} returned to Unassigned)`
        : `Removed empty Group ${idx + 1}`,
    );
  };

  const handleRevert = () => {
    if (!baseline || !dirty) return;
    setEditState({
      groups: baseline.groups.map((g) => ({
        memberIds: [...g.memberIds],
        memberNames: [...g.memberNames],
      })),
      unassigned: baseline.unassigned.map((s) => ({...s})),
    });
    setDirty(false);
    showToast('Reverted to last saved state');
  };

  const handleSave = async () => {
    if (!sessionId) {
      showToast('No active session');
      return;
    }
    if (editState.unassigned.length > 0) {
      showToast(
        `${editState.unassigned.length} student(s) unassigned — move them into a group first`,
      );
      return;
    }
    const filteredGroups = editState.groups.filter((g) => g.memberIds.length > 0);
    if (filteredGroups.length === 0) {
      showToast('Add at least one student to a group first');
      return;
    }
    try {
      const payload = filteredGroups.map((g, idx) => ({
        groupNumber: idx + 1,
        memberIds: g.memberIds,
        memberNames: g.memberNames,
      }));
      await fw(
        update(ref(db, `sessions/${sessionId}`), {
          groupAssignments: payload,
          forceAssignGroupings: true,
        }),
      );
      const savedSnapshot: EditState = {
        groups: filteredGroups.map((g) => ({
          memberIds: [...g.memberIds],
          memberNames: [...g.memberNames],
        })),
        unassigned: [],
      };
      setBaseline(savedSnapshot);
      baselineCapturedRef.current = true;
      setDirty(false);
      showToast(
        `Finalised — ${filteredGroups.length} group${filteredGroups.length === 1 ? '' : 's'} saved ✓`,
      );
    } catch (e: any) {
      showToast(`Save failed: ${e.message ?? 'unknown error'}`);
    }
  };

  if (!activeSession) {
    return (
      <View style={styles.loadingroot}>
        <ActivityIndicator color={c.navy} size="large" />
      </View>
    );
  }

  const totalGrouped = editState.groups.reduce((acc, g) => acc + g.memberIds.length, 0);
  const totalStudents = allStudents.length;
  const hasFinalized =
    !!finalizedGroups && Array.isArray(finalizedGroups) && finalizedGroups.length > 0;

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.navbar}>
        <Pressable
          onPress={() => router.replace('/kelda/session')}
          style={styles.backbutton}
          hitSlop={12}
        >
          <Text style={styles.backtext}>← Back</Text>
        </Pressable>
        <Text style={styles.navbartitle}>Manage Groupings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollcontent}>
        <Wide>
          <View style={styles.headerBar}>
            <View style={{flex: 1}}>
              <Text style={styles.headerTitle}>
                {totalGrouped}/{totalStudents} students in {editState.groups.length} groups
              </Text>
              <Text style={styles.headerSub}>
                {hasFinalized
                  ? 'Showing saved groupings — edit and Save again to overwrite.'
                  : 'Preview of auto-assignment — edit manually or Save as final.'}
              </Text>
            </View>
            <View style={styles.headerActions}>
              <Pressable
                onPress={() => {
                  if (!dirty) {
                    showToast('Nothing to revert — make an edit first');
                    return;
                  }
                  handleRevert();
                }}
                style={[styles.revertpill, !dirty && styles.revertpillMuted]}
                hitSlop={8}
              >
                <Text style={[styles.revertpilltext, !dirty && styles.revertpilltextMuted]}>
                  ↶ Revert
                </Text>
              </Pressable>
              {dirty && (
                <View style={styles.dirtypill}>
                  <Text style={styles.dirtypilltext}>Edited</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.actionsrow}>
            <Btn
              label="Auto-Assign"
              onPress={handleAutoAssign}
              color={c.purple}
              textColor={c.white}
              icon="settings"
              style={styles.actionbtn}
            />
            <Btn
              label="Save & Finalize"
              onPress={handleSave}
              color={c.green}
              textColor={c.white}
              icon="complete"
              style={styles.actionbtn}
            />
          </View>

          {editState.unassigned.length > 0 && (
            <View style={[styles.groupcard, styles.groupcardWarn]}>
              <Text style={styles.groupname}>Unassigned ({editState.unassigned.length})</Text>
              {editState.unassigned.map((s) => (
                <StudentPill key={s.id} student={s} onMove={handleMove} currentGroupIdx={-1} />
              ))}
            </View>
          )}

          {editState.groups.map((g, idx) => (
            <View
              key={idx}
              style={[
                styles.groupcard,
                g.memberIds.length > 0 && g.memberIds.length < 3 && styles.groupcardWarn,
              ]}
            >
              <View style={styles.groupheadrow}>
                <Text style={styles.groupname}>
                  Group {idx + 1}
                  {g.memberIds.length > 0 &&
                    ` · ${g.memberIds.length} ${g.memberIds.length === 1 ? 'student' : 'students'}`}
                </Text>
                {editState.groups.length > 1 && (
                  <Pressable
                    onPress={() => handleRemoveGroup(idx)}
                    style={styles.removegroupbtn}
                    hitSlop={8}
                  >
                    <Text style={styles.removegroupbtntext}>Remove ✕</Text>
                  </Pressable>
                )}
              </View>
              {g.memberIds.length > 0 ? (
                g.memberIds.map((id, i) => (
                  <StudentPill
                    key={id}
                    student={{id, name: g.memberNames[i] ?? id}}
                    onMove={handleMove}
                    currentGroupIdx={idx}
                  />
                ))
              ) : (
                <Text style={styles.empty}>
                  Empty — tap a student under Unassigned to move them here.
                </Text>
              )}
            </View>
          ))}

          <View style={{alignSelf: 'stretch', marginTop: 8}}>
            <Btn
              label="+ Add empty group"
              onPress={handleAddGroup}
              color={c.grey}
              textColor={c.navy}
              style={{width: '100%'}}
            />
          </View>

          <View style={styles.tipcard}>
            <Text style={styles.tiptitle}>💡 Tip</Text>
            <Text style={styles.tiptext}>
              Tap a student to move them to another group or to Unassigned. Use Auto-Assign to roll
              the algorithm again. Save & Finalize locks the choice for all students immediately.
            </Text>
          </View>
        </Wide>
      </ScrollView>

      {toast && (
        <View pointerEvents="none" style={styles.toastwrap}>
          <View style={styles.toast}>
            <Text style={styles.toasttext}>{toast}</Text>
          </View>
        </View>
      )}

      <Modal
        visible={movePicker !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setMovePicker(null)}
      >
        <Pressable style={styles.modalbackdrop} onPress={() => setMovePicker(null)}>
          <Pressable style={styles.modalsheet} onPress={() => {}}>
            <Text style={styles.modaltitle}>Move {movePicker?.studentName ?? 'student'}</Text>
            {movePicker?.currentGroupIdx !== -1 && (
              <Pressable
                style={styles.modaloption}
                onPress={() => {
                  if (movePicker) {
                    const name = movePicker.studentName;
                    doMove(movePicker.studentId, movePicker.currentGroupIdx, -1);
                    showToast(`Moved ${name} to Unassigned`);
                  }
                  setMovePicker(null);
                }}
              >
                <Text style={styles.modaloptiontext}>← Unassigned</Text>
              </Pressable>
            )}
            {editState.groups.map((g, idx) => {
              if (idx === movePicker?.currentGroupIdx) return null;
              const capacity = g.memberIds.length;
              return (
                <Pressable
                  key={idx}
                  style={styles.modaloption}
                  onPress={() => {
                    if (movePicker) {
                      const name = movePicker.studentName;
                      doMove(movePicker.studentId, movePicker.currentGroupIdx, idx);
                      showToast(`Moved ${name} to Group ${idx + 1}`);
                    }
                    setMovePicker(null);
                  }}
                >
                  <Text style={styles.modaloptiontext}>
                    → Group {idx + 1} · {capacity} {capacity === 1 ? 'student' : 'students'}
                  </Text>
                </Pressable>
              );
            })}
            {editState.groups.length === 1 && movePicker?.currentGroupIdx === 0 && (
              <Text style={styles.modalhint}>
                Tap “+ Add empty group” first to enable more moves.
              </Text>
            )}
            <Pressable
              style={[styles.modaloption, styles.modaloptioncancel]}
              onPress={() => setMovePicker(null)}
            >
              <Text style={[styles.modaloptiontext, {color: c.grey}]}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function StudentPill({
  student,
  onMove,
  currentGroupIdx,
}: {
  student: StudentInfo;
  onMove: (studentId: string, currentGroupIdx: number) => void;
  currentGroupIdx: number;
}) {
  return (
    <Pressable onPress={() => onMove(student.id, currentGroupIdx)} style={styles.pillrow}>
      <View style={styles.pilldot}>
        <Text style={styles.pilldotletter}>{student.name.charAt(0).toUpperCase()}</Text>
      </View>
      <Text style={styles.pillname}>{student.name}</Text>
      <View style={{flex: 1}} />
      <Text style={styles.pillmove}>Move →</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  loadingroot: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  root: {flex: 1, backgroundColor: c.offWhite},
  navbar: {
    backgroundColor: c.navy,
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  backbutton: {
    marginRight: 4,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  backtext: {color: c.yellow, fontFamily: 'DMSans_700Bold', fontSize: 16},
  navbartitle: {fontFamily: 'DMSans_700Bold', fontSize: 20, color: c.white, flex: 1},
  scrollcontent: {padding: 28, gap: 20},
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  revertpill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: c.offWhite,
    borderWidth: 1,
    borderColor: c.grey,
  },
  revertpillMuted: {
    backgroundColor: 'transparent',
    borderColor: '#d0d5dd',
  },
  revertpilltext: {
    color: c.navy,
    fontFamily: 'DMSans_700Bold',
    fontSize: 12,
  },
  revertpilltextMuted: {
    color: c.grey,
  },
  headerTitle: {fontFamily: 'DMSans_700Bold', fontSize: 18, color: c.navy},
  headerSub: {fontFamily: 'DMSans_400Regular', fontSize: 12, color: c.grey, marginTop: 2},
  dirtypill: {
    backgroundColor: c.orange,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  dirtypilltext: {color: c.white, fontFamily: 'DMSans_700Bold', fontSize: 11},
  actionsrow: {gap: 10},
  actionbtn: {width: '100%'},
  groupcard: {
    backgroundColor: c.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  groupcardWarn: {borderColor: c.orange},
  groupheadrow: {flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4},
  groupname: {fontFamily: 'DMSans_700Bold', fontSize: 15, color: c.navy, flex: 1},
  removegroupbtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#FEE',
    borderRadius: 12,
  },
  removegroupbtntext: {color: c.red, fontFamily: 'DMSans_700Bold', fontSize: 11},
  empty: {fontFamily: 'DMSans_400Regular', fontSize: 12, color: c.grey, paddingVertical: 8},
  pillrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: c.offWhite,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pilldot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: c.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pilldotletter: {fontFamily: 'DMSans_700Bold', color: c.white, fontSize: 14},
  pillname: {fontFamily: 'DMSans_500Medium', fontSize: 15, color: c.navy},
  pillmove: {color: c.purple, fontFamily: 'DMSans_700Bold', fontSize: 12},
  tipcard: {
    marginTop: 16,
    padding: 18,
    backgroundColor: '#F0F7FF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D0E2FF',
  },
  tiptitle: {fontFamily: 'DMSans_700Bold', fontSize: 13, color: c.navy, marginBottom: 4},
  tiptext: {fontFamily: 'DMSans_400Regular', fontSize: 12, color: c.navy, lineHeight: 18},
  toastwrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 44,
  },
  toast: {
    backgroundColor: c.navy,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    maxWidth: '100%',
  },
  toasttext: {
    color: c.white,
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
    textAlign: 'center',
  },
  modalbackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalsheet: {
    backgroundColor: c.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    gap: 8,
  },
  modaltitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 17,
    color: c.navy,
    marginBottom: 12,
  },
  modaloption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: c.offWhite,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modaloptioncancel: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    alignItems: 'center',
    marginTop: 6,
  },
  modaloptiontext: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 15,
    color: c.navy,
  },
  modalhint: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: c.grey,
    paddingVertical: 6,
    textAlign: 'center',
  },
});
