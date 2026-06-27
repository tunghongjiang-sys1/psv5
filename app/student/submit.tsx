// app/student/submit.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { ref, update } from 'firebase/database';
import { db } from '../../lib/firebaseConfig';
import { usefb, fw, itemsbuy, itemsbor, defpers, c } from '../../lib/helpers';
import { useStudentState } from '../../lib/students';
import { ProgressBar, Wide, Btn, PsIcon } from '../../components/parts';

export default function StudentSummaryScreen() {
  const router = useRouter();
  const { studentId, sessionId, studentName } = useStudentState();
  const [submitting, setSubmitting] = useState(false);

  // Redirect if state not set
  useEffect(() => {
    if (!studentId || !sessionId) {
      router.replace('/student/name');
    }
  }, [studentId, sessionId]);

  const student = usefb(sessionId && studentId ? `sessions/${sessionId}/students/${studentId}` : null);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await fw(
        update(ref(db, `sessions/${sessionId}/students/${studentId}`), {
          submitted: true,
        })
      );
      Alert.alert('Submitted!', 'Your work has been submitted to your teacher.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!student) {
    return (
      <View style={styles.loadingroot}>
        <ActivityIndicator color={c.teal} size="large" />
      </View>
    );
  }

  const boughtItems = itemsbuy.filter((i) => (student.bought || {})[i.id] > 0);
  const borrowedItems = itemsbor.filter((i) => (student.borrowed || {})[i.id] > 0);
  const chatPersonas = defpers.filter((p) => (student.chats || {})[p.id]);


  return (
    <SafeAreaView style={styles.root}>
      <ProgressBar step="Summary" />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
        <Wide>
          <Text style={styles.title}>Summary:</Text>

          <View style={styles.summarygrid}>
            <View style={styles.summarycard}>
              <Text style={styles.cardheader}>Items Bought</Text>
              <View style={styles.itemsbox}>
                {boughtItems.length === 0 ? (
                  <Text style={styles.emptytext}>Nothing bought</Text>
                ) : (
                  boughtItems.map((i) => (
                    <Text key={i.id} style={styles.itemrow}>
                      {i.emoji} {i.name} x{student.bought[i.id]}
                    </Text>
                  ))
                )}
              </View>

              <Text style={[styles.cardheader, { marginTop: 16 }]}>Items Borrowed</Text>
              <View style={styles.itemsbox}>
                {borrowedItems.length === 0 ? (
                  <Text style={styles.emptytext}>Nothing borrowed</Text>
                ) : (
                  borrowedItems.map((i) => (
                    <Text key={i.id} style={styles.itemrow}>
                      {i.emoji} {i.name} x{student.borrowed[i.id]}
                    </Text>
                  ))
                )}
              </View>
            </View>

            <View style={[styles.summarycard, { flex: 1 }]}>
              <Text style={styles.cardheader}>Chats completed</Text>
              <View style={styles.itemsbox}>
                {chatPersonas.length === 0 ? (
                  <Text style={styles.emptytext}>No chats yet</Text>
                ) : (
                  chatPersonas.map((p) => (
                    <Text key={p.id} style={styles.itemrow}>
                      💬 {p.name}
                    </Text>
                  ))
                )}
              </View>
            </View>

            <View style={[styles.summarycard, { flex: 2 }]}>
              <Text style={styles.cardheader}>Reflection</Text>
              <View style={[styles.itemsbox, { padding: 16 }]}>
                <Text style={styles.reflectionprompt}>
                  What have you learnt from this experience?
                </Text>
                <Text style={styles.reflectioncontent}>
                  {student.reflection || 'No reflection yet'}
                </Text>
              </View>
            </View>
          </View>

          {submitting ? (
            <ActivityIndicator color={c.navy} style={{ marginTop: 12 }} />
          ) : (
            <Btn
              label={student.submitted ? "SUBMITTED" : "SUBMIT"}
              onPress={handleSubmit}
              color={c.yellow}
              textColor={c.navy}
              style={{ marginTop: 12 }}
              disabled={student.submitted}
              icon={student.submitted ? 'complete' : 'checklist'}
            />
          )}

          {student.submitted && (
            <View style={styles.submittedalert}>
              <PsIcon name="complete" size={18} />
              <Text style={styles.submittedalerttext}>Submitted!</Text>
            </View>
          )}
        </Wide>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingroot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  root: {
    flex: 1,
    backgroundColor: c.white,
  },
  title: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 28,
    color: c.navy,
    marginBottom: 16,
  },
  summarygrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  summarycard: {
    backgroundColor: c.purpleMid,
    borderRadius: 16,
    padding: 18,
    flex: 1,
    minWidth: 200,
  },
  cardheader: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    color: c.teal,
    marginBottom: 10,
  },
  itemsbox: {
    backgroundColor: c.teal,
    borderRadius: 12,
    padding: 12,
  },
  emptytext: {
    fontFamily: 'DMSans_400Regular',
    color: c.navy,
  },
  itemrow: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
    color: c.navy,
    marginBottom: 2,
  },
  reflectionprompt: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
    color: c.navy,
    marginBottom: 6,
  },
  reflectioncontent: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: '#2a2a2a',
  },
  submittedalert: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  submittedalerttext: {
    fontFamily: 'DMSans_700Bold',
    color: c.green,
    textAlign: 'center',
  },
});
