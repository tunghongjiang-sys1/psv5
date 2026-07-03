
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, SafeAreaView, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { db, ref, update } from '../../lib/firebaseConfig';
import { usefb, fw, itemsbuy, itemsbor, defpers, c, normalizeReflectionQuestions, getReflectionAnswers } from '../../lib/helpers';
import { useStudentState } from '../../lib/students';
import { ProgressBar, Wide, Btn, PsIcon } from '../../components/parts';

export default function StudentSummaryScreen() {
  const router = useRouter();
  const { studentId, sessionId, studentName } = useStudentState();
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);

  useEffect(() => {
    if (!studentId || !sessionId) {
      router.replace('/student/name');
    }
  }, [studentId, sessionId]);

  const student = usefb(sessionId && studentId ? `sessions/${sessionId}/students/${studentId}` : null);
  const rawQuestions = usefb(sessionId ? `sessions/${sessionId}/reflectionQuestions` : null);
  const questions = normalizeReflectionQuestions(rawQuestions);

  useEffect(() => {
    if (student?.rating) {
      setRating(student.rating);
    }
  }, [student?.rating]);

  const handleRate = async (val: number) => {
    setRating(val);
    try {
      await update(ref(db, `sessions/${sessionId}/students/${studentId}`), {
        rating: val,
      });
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleEndSession = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await fw(
        update(ref(db, `sessions/${sessionId}/students/${studentId}`), {
          submitted: true,
          rating,
        })
      );
      Alert.alert('Session Ended!', 'Your work and feedback have been submitted to your teacher.');
    } catch (e: any) {
      Alert.alert('Error ending session', e.message);
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
  const reflectionQA = getReflectionAnswers(student, questions);

  return (
    <SafeAreaView style={styles.root}>
      <ProgressBar step="Summary" />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
        <Wide>
          <Text style={styles.title}>Session Summary:</Text>

          <View style={styles.summarygrid}>
            <View style={styles.summarycard}>
              <Text style={styles.cardheader}>Items Bought</Text>
              <View style={styles.itemsbox}>
                {boughtItems.length === 0 ? (
                  <Text style={styles.emptytext}>Nothing bought</Text>
                ) : (
                  boughtItems.map((i) => (
                    <Text key={i.id} style={styles.itemrow}>
                      {i.name} x{student.bought[i.id]}
                    </Text>
                  ))
                )}
              </View>

              <Text style={[styles.cardheader, { marginTop: 16 }]}>Active Aging Centre (Borrowed)</Text>
              <View style={styles.itemsbox}>
                {borrowedItems.length === 0 ? (
                  <Text style={styles.emptytext}>Nothing borrowed</Text>
                ) : (
                  borrowedItems.map((i) => (
                    <Text key={i.id} style={styles.itemrow}>
                      {i.name} x{student.borrowed[i.id]}
                    </Text>
                  ))
                )}
              </View>
            </View>

            <View style={[styles.summarycard, { flex: 1 }]}>
              <Text style={styles.cardheader}>Interviews Completed</Text>
              <View style={styles.itemsbox}>
                {chatPersonas.length === 0 ? (
                  <Text style={styles.emptytext}>No interviews completed</Text>
                ) : (
                  chatPersonas.map((p) => (
                    <Text key={p.id} style={styles.itemrow}>
                      {p.name}
                    </Text>
                  ))
                )}
              </View>

              {!!student.whiteboardNotes && (
                <>
                  <Text style={[styles.cardheader, { marginTop: 16 }]}>Whiteboard Notes</Text>
                  <View style={styles.itemsbox}>
                    <Text style={styles.emptytext}>{student.whiteboardNotes}</Text>
                  </View>
                </>
              )}
            </View>

            <View style={[styles.summarycard, { flex: 2 }]}>
              <Text style={styles.cardheader}>Reflections Summary</Text>
              <View style={[styles.itemsbox, { padding: 14 }]}>
                {reflectionQA.map(({ question, answer }, qIdx) => (
                  <View key={qIdx} style={{ marginBottom: 10 }}>
                    <Text style={styles.reflectionprompt}>Q{qIdx + 1}: {question}</Text>
                    <Text style={styles.reflectioncontent}>{answer || 'No answer provided'}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>


          <View style={styles.ratingbox}>
            <Text style={styles.ratingtitle}>Rate your learning experience today:</Text>
            <View style={styles.loopiesrow}>
              {[1, 2, 3, 4, 5].map((val) => {
                const filled = val <= rating;
                return (
                  <Pressable
                    key={val}
                    onPress={() => handleRate(val)}
                    style={({ pressed }) => [
                      styles.loopiecircle,
                      pressed && { transform: [{ scale: 0.92 }] },
                    ]}
                  >
                    <Image
                      source={filled ? require('../../assets/mascot.png') : require('../../assets/icons for ps/complete.png')}
                      style={[styles.loopieimage, { opacity: filled ? 1 : 0.3 }]}
                      resizeMode="contain"
                    />
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.ratingsubtitle}>
              {rating > 0 ? `Selected: ${rating} / 5 Loopies` : 'Tap a loopie to rate'}
            </Text>
          </View>


          {submitting ? (
            <ActivityIndicator color={c.navy} size="large" style={{ marginTop: 16 }} />
          ) : (
            <Btn
              label={student.submitted ? "SESSION ENDED ✓" : "END SESSION"}
              onPress={handleEndSession}
              color={c.yellow}
              textColor={c.navy}
              style={{ marginTop: 16 }}
              disabled={student.submitted}
              icon={student.submitted ? 'complete' : 'checklist'}
            />
          )}

          {student.submitted && (
            <View style={styles.submittedalert}>
              <PsIcon name="complete" size={20} />
              <Text style={styles.submittedalerttext}>Session Completed! Thank you for participating!</Text>
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
    marginBottom: 16,
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
    marginBottom: 2,
  },
  reflectioncontent: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: c.navy,
  },
  ratingbox: {
    backgroundColor: '#FFF8EB',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  ratingtitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    color: c.navy,
    marginBottom: 14,
  },
  loopiesrow: {
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'center',
    marginBottom: 8,
  },
  loopiecircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  loopieimage: {
    width: 36,
    height: 36,
  },
  ratingsubtitle: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: c.greyDark,
  },
  submittedalert: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    backgroundColor: '#E8F8F5',
    padding: 14,
    borderRadius: 12,
  },
  submittedalerttext: {
    fontFamily: 'DMSans_700Bold',
    color: c.green,
    fontSize: 15,
  },
});
