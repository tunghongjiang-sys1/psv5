
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, ActivityIndicator, Alert, Pressable, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { db, ref, update } from '../../lib/firebaseConfig';
import { usefb, fw, c, normalizeReflectionQuestions, getReflectionAnswers } from '../../lib/helpers';
import { useStudentState } from '../../lib/students';
import { ProgressBar, Wide, Btn } from '../../components/parts';

export default function StudentReflectionsScreen() {
  const router = useRouter();
  const { studentId, sessionId, studentName } = useStudentState();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!studentId || !sessionId) {
      router.replace('/student/name');
    }
  }, [studentId, sessionId]);

  const rawQuestions = usefb(sessionId ? `sessions/${sessionId}/reflectionQuestions` : null);
  const questions = normalizeReflectionQuestions(rawQuestions);

  const summaryUnlocked = usefb(sessionId ? `sessions/${sessionId}/unlocked/summary` : null);
  const studentsData = usefb(sessionId ? `sessions/${sessionId}/students` : null);

  const students = studentsData ? Object.values(studentsData) : [];
  const reflections = students.filter((s: any) => s.reflection || (s.reflections && Object.keys(s.reflections).length > 0));

  useEffect(() => {
    if (studentsData && studentId) {
      const mine = (studentsData as any)[studentId];
      if (mine && !submitted) {
        const initialAnswers: Record<number, string> = {};
        questions.forEach((_, idx) => {
          if (mine.reflections && mine.reflections[idx] !== undefined) {
            initialAnswers[idx] = String(mine.reflections[idx]);
          } else if (idx === 0 && mine.reflection) {
            initialAnswers[idx] = String(mine.reflection);
          } else {
            initialAnswers[idx] = '';
          }
        });
        setAnswers(initialAnswers);
        if (mine.reflection || (mine.reflections && Object.keys(mine.reflections).length > 0)) {
          setSubmitted(true);
        }
      }
    }
  }, [studentsData, studentId, questions.length]);

  const handleTextChange = (text: string) => {
    setAnswers((prev) => ({ ...prev, [currentSlide]: text }));
  };

  const submitReflection = async () => {
    const mainRef = answers[0]?.trim() || Object.values(answers).find((a) => a.trim()) || '';
    if (!mainRef) {
      Alert.alert('Please answer at least one question!');
      return;
    }
    setSaving(true);
    try {
      await fw(
        update(ref(db, `sessions/${sessionId}/students/${studentId}`), {
          reflection: mainRef,
          reflections: answers,
        })
      );
      setSubmitted(true);
      setShowForm(false);
      Alert.alert('Reflections Saved!', 'Your answers have been shared.');
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
              Student Reflections
            </Text>
            {!showForm && (
              <Pressable
                onPress={() => {
                  setShowForm(true);
                  setCurrentSlide(0);
                }}
                style={({ pressed }) => [
                  styles.addbutton,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text style={styles.addbuttontext}>{submitted ? 'Edit' : '+ Answer'}</Text>
              </Pressable>
            )}
          </View>


          {showForm && (
            <View style={styles.formcontainer}>
              <View style={styles.slideheader}>
                <Text style={styles.slidenumber}>Question {currentSlide + 1} of {questions.length}</Text>
                <View style={styles.dotsrow}>
                  {questions.map((_, idx) => (
                    <Pressable
                      key={idx}
                      onPress={() => setCurrentSlide(idx)}
                      style={[styles.dot, currentSlide === idx && styles.activeDot]}
                    />
                  ))}
                </View>
              </View>

              <Text style={styles.formprompt}>{questions[currentSlide]}</Text>

              <TextInput
                style={styles.reflectioninput}
                value={answers[currentSlide] || ''}
                onChangeText={handleTextChange}
                placeholder="Type your reflection answer here..."
                placeholderTextColor={c.greyLight}
                multiline
              />

              <View style={styles.slideactions}>
                <Pressable
                  disabled={currentSlide === 0}
                  onPress={() => setCurrentSlide((prev) => Math.max(0, prev - 1))}
                  style={[styles.navbtn, currentSlide === 0 && styles.navbtndisabled]}
                >
                  <Text style={styles.navbtntext}>← Previous</Text>
                </Pressable>

                {currentSlide < questions.length - 1 ? (
                  <Pressable
                    onPress={() => setCurrentSlide((prev) => Math.min(questions.length - 1, prev + 1))}
                    style={[styles.navbtn, styles.nextbtn]}
                  >
                    <Text style={[styles.navbtntext, styles.nextbtntext]}>Next Question →</Text>
                  </Pressable>
                ) : (
                  saving ? (
                    <ActivityIndicator color={c.navy} />
                  ) : (
                    <Btn
                      label="Save All Answers ✓"
                      onPress={submitReflection}
                      color={c.yellow}
                      textColor={c.navy}
                    />
                  )
                )}
              </View>

              <Pressable
                onPress={() => setShowForm(false)}
                style={styles.cancelbutton}
              >
                <Text style={styles.canceltext}>Close Form</Text>
              </Pressable>
            </View>
          )}


          {reflections.map((r: any) => {
            const isSelf = r.id === studentId;
            const rAnswers = getReflectionAnswers(r, questions);

            return (
              <View
                key={r.id}
                style={[
                  styles.reflectioncard,
                  { backgroundColor: isSelf ? c.teal : '#EEF2F6' },
                ]}
              >
                <Text style={[styles.cardname, { color: isSelf ? c.white : c.navy }]}>
                  {isSelf ? 'Your Reflections' : `${r.name}`}:
                </Text>
                {rAnswers.map(({ question, answer }, qIdx) => (
                  <View key={qIdx} style={styles.qablock}>
                    <Text style={[styles.cardprompt, { color: isSelf ? '#E0F7F5' : c.purpleMid }]}>
                      Q{qIdx + 1}: {question}
                    </Text>
                    <Text style={[styles.cardtext, { color: isSelf ? c.white : c.black }]}>
                      {answer || '(No answer provided)'}
                    </Text>
                  </View>
                ))}
              </View>
            );
          })}

          <Btn
            label="Continue to Whiteboard →"
            onPress={() => router.push('/student/whiteboard')}
            color={c.purple}
            textColor={c.white}
            style={{ marginTop: 24 }}
          />
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
    marginBottom: 20,
  },
  title: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 24,
    color: c.navy,
    flex: 1,
  },
  addbutton: {
    backgroundColor: c.teal,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addbuttontext: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
    color: c.white,
  },
  formcontainer: {
    backgroundColor: '#EBF3FA',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: c.teal,
  },
  slideheader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  slidenumber: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
    color: c.purpleMid,
  },
  dotsrow: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: c.greyLight,
  },
  activeDot: {
    backgroundColor: c.teal,
    width: 18,
  },
  formprompt: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 18,
    color: c.navy,
    marginBottom: 14,
    lineHeight: 24,
  },
  reflectioninput: {
    backgroundColor: c.white,
    borderRadius: 14,
    padding: 14,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: c.navy,
    minHeight: 110,
    marginBottom: 16,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#D0D7DE',
  },
  slideactions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  navbtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: c.greyLight,
  },
  navbtndisabled: {
    opacity: 0.4,
  },
  navbtntext: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
    color: c.navy,
  },
  nextbtn: {
    backgroundColor: c.navy,
  },
  nextbtntext: {
    color: c.white,
  },
  cancelbutton: {
    alignSelf: 'center',
    marginTop: 14,
  },
  canceltext: {
    fontFamily: 'DMSans_500Medium',
    color: c.greyDark,
    fontSize: 13,
  },
  reflectioncard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  cardname: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 18,
    marginBottom: 12,
  },
  qablock: {
    marginBottom: 10,
  },
  cardprompt: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
  },
  cardtext: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    marginTop: 4,
    lineHeight: 20,
  },
});