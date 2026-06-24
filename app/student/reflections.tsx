// app/student/reflections.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, ActivityIndicator, Alert, Pressable, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { ref, update } from 'firebase/database';
import { db } from '../../lib/firebaseConfig';
import { usefb, fw, c } from '../../lib/helpers';
import { useStudentState } from '../../lib/students';
import { ProgressBar, Wide, Btn } from '../../components/parts';

export default function StudentReflectionsScreen() {
  const router = useRouter();
  const { studentId, sessionId, studentName } = useStudentState();
  const [myReflection, setMyReflection] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  // Redirect if state not set
  useEffect(() => {
    if (!studentId || !sessionId) {
      router.replace('/student/name');
    }
  }, [studentId, sessionId]);

  const summaryUnlocked = usefb(sessionId ? `sessions/${sessionId}/unlocked/summary` : null);
  const studentsData = usefb(sessionId ? `sessions/${sessionId}/students` : null);

  const students = studentsData ? Object.values(studentsData) : [];
  const reflections = students.filter((s: any) => s.reflection);

  useEffect(() => {
    if (studentsData && studentId) {
      const mine = (studentsData as any)[studentId];
      if (mine?.reflection && !submitted) {
        setMyReflection(mine.reflection);
        setSubmitted(true);
      }
    }
  }, [studentsData, studentId]);

  const submitReflection = async () => {
    if (!myReflection.trim()) {
      Alert.alert('Write something first!');
      return;
    }
    setSaving(true);
    try {
      await fw(
        update(ref(db, `sessions/${sessionId}/students/${studentId}`), {
          reflection: myReflection.trim(),
        })
      );
      setSubmitted(true);
      setShowForm(false);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };


  return (
    <SafeAreaView style={styles.root}>
      <ProgressBar step="Reflections" />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
        <Wide>
          <View style={styles.headerrow}>
            <Text style={styles.title}>
              View fellow students' reflections!
            </Text>
            {!submitted && !showForm && (
              <Pressable
                onPress={() => setShowForm(true)}
                style={({ pressed }) => [
                  styles.addbutton,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text style={styles.addbuttontext}>+</Text>
              </Pressable>
            )}
          </View>

          {showForm && (
            <View style={styles.formcontainer}>
              <Text style={styles.formname}>{studentName}:</Text>
              <Text style={styles.formprompt}>
                What have you learnt from this experience?
              </Text>
              <TextInput
                style={styles.reflectioninput}
                value={myReflection}
                onChangeText={setMyReflection}
                placeholder="Type in what you have learnt over here..."
                placeholderTextColor={c.greyLight}
                multiline
              />
              <View style={styles.formactions}>
                {saving ? (
                  <ActivityIndicator color={c.navy} />
                ) : (
                  <>
                    <Btn
                      label="Submit →"
                      onPress={submitReflection}
                      color={c.yellow}
                      textColor={c.navy}
                    />
                    <Pressable
                      onPress={() => setShowForm(false)}
                      style={styles.cancelbutton}
                    >
                      <Text style={styles.canceltext}>Cancel</Text>
                    </Pressable>
                  </>
                )}
              </View>
            </View>
          )}

          {reflections.map((r: any) => {
            const isSelf = r.id === studentId;
            return (
              <View
                key={r.id}
                style={[
                  styles.reflectioncard,
                  { backgroundColor: isSelf ? c.teal : '#DDD' },
                ]}
              >
                <Text style={[styles.cardname, { color: isSelf ? c.white : c.navy }]}>
                  {isSelf ? 'You' : r.name}:
                </Text>
                <Text style={[styles.cardprompt, { color: isSelf ? c.white : c.navy }]}>
                  What have you learnt from this experience?
                </Text>
                <Text style={[styles.cardtext, { color: isSelf ? c.white : c.black }]}>
                  {r.reflection}
                </Text>
              </View>
            );
          })}

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
  headerrow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 22,
    color: c.navy,
    flex: 1,
    paddingRight: 12,
  },
  addbutton: {
    backgroundColor: c.teal,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addbuttontext: {
    fontSize: 24,
    color: c.white,
    lineHeight: 28,
  },
  formcontainer: {
    backgroundColor: '#DDD',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  formname: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    color: c.navy,
  },
  formprompt: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
    color: c.navy,
    marginBottom: 12,
  },
  reflectioninput: {
    backgroundColor: c.offWhite,
    borderRadius: 12,
    padding: 14,
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: c.navy,
    minHeight: 80,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  formactions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cancelbutton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  canceltext: {
    fontFamily: 'DMSans_700Bold',
    color: c.greyDark,
    fontSize: 15,
  },
  reflectioncard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  cardname: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 17,
  },
  cardprompt: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
    marginTop: 2,
  },
  cardtext: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    marginTop: 8,
  },
  lockbox: {
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  locktext: {
    fontFamily: 'DMSans_500Medium',
    color: c.grey,
    fontSize: 13,
  },
});