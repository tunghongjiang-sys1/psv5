// app/student/groupings.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ref, update } from 'firebase/database';
import { db } from '../../lib/firebaseConfig';
import { usefb, fw, c } from '../../lib/helpers';
import { useStudentState } from '../../lib/students';
import { ProgressBar, Wide, Btn } from '../../components/parts';

export default function StudentGroupingsScreen() {
  const router = useRouter();
  const { studentId, sessionId, studentName } = useStudentState();
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigatedRef = useRef(false);

  // Redirect if state not set
  useEffect(() => {
    if (!studentId || !sessionId) {
      router.replace('/student/name');
    }
  }, [studentId, sessionId]);

  const studentsData = usefb(sessionId ? `sessions/${sessionId}/students` : null);
  const interviewUnlocked = usefb(sessionId ? `sessions/${sessionId}/unlocked/interview` : null);

  const students = studentsData
    ? Object.values(studentsData).filter((s: any) => s.id !== studentId)
    : [];

  useEffect(() => {
    if (interviewUnlocked === true && submitted && !navigatedRef.current) {
      navigatedRef.current = true;
      router.replace('/student/interview');
    }
  }, [interviewUnlocked, submitted]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const handleGo = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await fw(
        update(ref(db, `sessions/${sessionId}/students/${studentId}`), {
          preferredGroup: selected,
        })
      );
      setSubmitted(true);
    } catch (e: any) {
      Alert.alert('Error', e.message);
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <ProgressBar step="Groupings" />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollcontent}>
        <Wide style={{ alignItems: 'center' }}>
          <Text style={styles.heading}>
            Choose the students whom you would like to be in a group with!
          </Text>

          <View style={styles.studentgrid}>
            {students.map((s: any) => {
              const sel = selected.includes(s.id);
              return (
                <Pressable
                  key={s.id}
                  onPress={() => toggle(s.id)}
                  style={[
                    styles.studentcard,
                    { backgroundColor: sel ? c.teal : c.greyDark },
                  ]}
                >
                  <Text style={[styles.studentname, { color: sel ? c.navy : c.white }]}>
                    {s.name}
                  </Text>
                </Pressable>
              );
            })}

            {students.length === 0 && (
              <Text style={styles.waitingtext}>
                Waiting for others to join...
              </Text>
            )}
          </View>

          {!submitted ? (
            saving ? (
              <ActivityIndicator color={c.teal} size="large" />
            ) : (
              <Btn label="Start" onPress={handleGo} />
            )
          ) : (
            <View style={styles.waitingcontainer}>
              <ActivityIndicator color={c.teal} size="large" />
              <Text style={styles.waitingsubtitle}>
                Waiting for teacher to unlock Interview/Map...
              </Text>
            </View>
          )}
        </Wide>
      </ScrollView>
    </View>
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
    marginBottom: 32,
    marginTop: 16,
  },
  studentgrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 40,
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
  waitingcontainer: {
    alignItems: 'center',
    gap: 12,
  },
  waitingsubtitle: {
    fontFamily: 'DMSans_500Medium',
    color: c.grey,
    fontSize: 14,
  },
});