
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, SafeAreaView, Share, Pressable, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { db, ref, update } from '../../lib/firebaseConfig';
import { usefb, fw, itemsbuy, itemsbor, defpers, c, normalizeReflectionQuestions, getReflectionAnswers } from '../../lib/helpers';
import { useStudentState } from '../../lib/students';
import { ProgressBar, Wide, Btn, PsIcon } from '../../components/parts';
import { getUniquePressedQuestions, parseTranscript } from './interview';

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

  const handleDownloadSummary = async () => {
    const lines: string[] = [];
    lines.push('Loopie Town Session Summary');
    lines.push('===========================');
    lines.push(`Student: ${student.name}`);
    lines.push(`Status: ${student.submitted ? 'Submitted' : 'In Progress'}`);
    if (student.submittedAt) {
      lines.push(`Submitted At: ${new Date(student.submittedAt).toLocaleString()}`);
    }
    lines.push('');

    lines.push('ITEMS BOUGHT');
    lines.push('------------');
    if (boughtItems.length === 0) {
      lines.push('  (none)');
    } else {
      boughtItems.forEach((i) => {
        lines.push(`  - ${i.name} x${student.bought[i.id]}`);
      });
    }
    lines.push('');

    lines.push('ACTIVE AGING CENTRE (BORROWED)');
    lines.push('------------------------------');
    if (borrowedItems.length === 0) {
      lines.push('  (none)');
    } else {
      borrowedItems.forEach((i) => {
        lines.push(`  - ${i.name} x${student.borrowed[i.id]}`);
      });
    }
    lines.push('');

    lines.push('INTERVIEWS');
    lines.push('----------');
    interviewProgress.forEach(({ persona, pressedCount, required, completed }) => {
      const mark = completed ? '[x]' : '[ ]';
      lines.push(`  ${mark} ${persona.name}  (${pressedCount} / ${required} questions)`);
    });
    lines.push('');

    lines.push('INTERVIEW CONVERSATIONS');
    lines.push('-----------------------');
    if (chattedPersonas.length === 0) {
      lines.push('  (no interview questions answered)');
    } else {
      const flattenForTxt = (value: string) =>
        String(value ?? '').replace(/[\r\n]+/g, ' ').trim();
      chattedPersonas.forEach(({ persona, messages, pressedCount, required }) => {
        lines.push(
          `  ${persona.name} (Age ${persona.age}) — ${pressedCount} / ${required} questions answered`
        );
        messages.forEach((m) => {
          const speaker = m.role === 'user' ? 'You' : persona.name;
          lines.push(`    [${speaker}] ${flattenForTxt(m.content)}`);
        });
        lines.push('');
      });
    }

    lines.push('REFLECTIONS');
    lines.push('-----------');
    if (reflectionQA.length === 0) {
      lines.push('  (no questions)');
    } else {
      reflectionQA.forEach(({ question, answer }, idx) => {
        lines.push(`  Q${idx + 1}: ${question}`);
        lines.push(`  A: ${answer || '(no answer yet)'}`);
        lines.push('');
      });
    }

    if (student.whiteboardNotes && student.whiteboardNotes.trim().length > 0) {
      lines.push('WHITEBOARD NOTES');
      lines.push('----------------');
      lines.push(student.whiteboardNotes);
      lines.push('');
    }

    lines.push('RATING');
    lines.push('------');
    lines.push(`  ${rating} / 5 Loopies`);

    const text = lines.join('\n');

    if (Platform.OS === 'web') {
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const safe = (student.name || 'student').replace(/[^a-z0-9_]+/gi, '_');
      const link = document.createElement('a');
      link.href = url;
      link.download = `loopietown-summary-${safe}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      try {
        await Share.share({
          message: text,
          title: 'Loopie Town Summary',
        });
      } catch (e: any) {
        Alert.alert('Summary', text);
      }
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
  const interviewProgress = defpers.map((p) => {
    const messages = parseTranscript(student.chats?.[p.id], p);
    const pressed = getUniquePressedQuestions(messages, p);
    const required = p.quickQuestions.length;
    return {
      persona: p,
      messages,
      pressedCount: pressed.length,
      required,
      completed: pressed.length >= required,
    };
  });
  const chatPersonasComplete = interviewProgress.filter((entry) => entry.completed);
  const chatPersonasPartial = interviewProgress.filter((entry) => !entry.completed);
  const chattedPersonas = interviewProgress.filter((entry) =>
    entry.messages.some((m) => m.role === 'user')
  );
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
                {chatPersonasComplete.length === 0 ? (
                  <Text style={styles.emptytext}>No interviews completed yet</Text>
                ) : (
                  chatPersonasComplete.map(({ persona }) => (
                    <Text key={persona.id} style={styles.itemrow}>
                      {persona.name}
                    </Text>
                  ))
                )}
              </View>

              {chatPersonasPartial.length > 0 && (
                <>
                  <Text style={[styles.cardheader, { marginTop: 16 }]}>
                    Interviews In Progress
                  </Text>
                  <View style={styles.itemsbox}>
                    {chatPersonasPartial.map(({ persona, pressedCount, required }) => (
                      <Text key={persona.id} style={styles.itemrow}>
                        {persona.name}  {pressedCount} / {required} questions
                      </Text>
                    ))}
                  </View>
                </>
              )}

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


          {chattedPersonas.length > 0 && (
            <View style={styles.transcriptsection}>
              <Text style={styles.transcriptheader}>Interview Conversations</Text>
              <Text style={styles.transcriptsubheader}>
                Your saved questions and each senior's replies from the interview phase.
              </Text>
              {chattedPersonas.map(({ persona, messages, pressedCount, required }) => (
                <View key={persona.id} style={styles.transcriptcard}>
                  <View style={styles.transcriptpersonarow}>
                    <Image
                      source={persona.photo}
                      style={styles.transcriptavatar}
                      resizeMode="cover"
                    />
                    <View style={styles.transcriptpersonatext}>
                      <Text style={styles.transcriptpersonaname}>{persona.name}</Text>
                      <Text style={styles.transcriptpersonameta}>
                        Age {persona.age} · {pressedCount} / {required} questions answered
                      </Text>
                    </View>
                  </View>
                  <View style={styles.transcriptbubbles}>
                    {messages.map((message, idx) => {
                      const isUser = message.role === 'user';
                      return (
                        <View
                          key={`${persona.id}-${message.role}-${idx}`}
                          style={[
                            styles.transcriptbubble,
                            isUser
                              ? styles.transcriptuserbubble
                              : styles.transcriptassistantbubble,
                          ]}
                        >
                          <Text
                            style={[
                              styles.transcriptbubbletext,
                              isUser && styles.transcriptuserbubbletext,
                            ]}
                          >
                            {message.content}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          )}


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
                      source={require('../../assets/mascot.png')}
                      style={[styles.loopieimage, { opacity: filled ? 1 : 0.25 }]}
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

          <Btn
            label="DOWNLOAD SUMMARY"
            onPress={handleDownloadSummary}
            color={c.purple}
            textColor={c.white}
            style={{ marginTop: 12 }}
            icon="checklist"
          />

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
  transcriptsection: {
    marginTop: 4,
    marginBottom: 16,
    gap: 12,
  },
  transcriptheader: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 20,
    color: c.navy,
    marginBottom: 4,
  },
  transcriptsubheader: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: c.grey,
    marginBottom: 6,
  },
  transcriptcard: {
    backgroundColor: c.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  transcriptpersonarow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F7',
  },
  transcriptavatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: c.greyLight,
  },
  transcriptpersonatext: {
    flex: 1,
    minWidth: 0,
  },
  transcriptpersonaname: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
    color: c.navy,
  },
  transcriptpersonameta: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: c.grey,
    marginTop: 2,
  },
  transcriptbubbles: {
    gap: 8,
  },
  transcriptbubble: {
    maxWidth: '92%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
  },
  transcriptuserbubble: {
    alignSelf: 'flex-end',
    backgroundColor: c.teal,
  },
  transcriptassistantbubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF1F8',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  transcriptbubbletext: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    lineHeight: 18,
    color: c.navy,
  },
  transcriptuserbubbletext: {
    color: c.navy,
  },
});
