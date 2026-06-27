// app/student/interview.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ref, update } from 'firebase/database';
import { db } from '../../lib/firebaseConfig';
import { c, fw, usefb } from '../../lib/helpers';
import {
  getInterviewQuickQuestions,
  getInterviewStarterMessage,
  interviewPersonas,
  makeInterviewReply,
  type InterviewPersona,
} from '../../components/interviewChatConfig';
import { useStudentState } from '../../lib/students';
import { Btn, ProgressBar, Wide } from '../../components/parts';

type Persona = InterviewPersona;
type MessageRole = 'assistant' | 'user';

type ChatMessage = {
  role: MessageRole;
  content: string;
};

const cleanForTranscript = (value: string) => value.replace(/\|\|\|/g, ' ').trim();

const getStarter = (persona: Persona): ChatMessage[] => [
  {
    role: 'assistant',
    content: getInterviewStarterMessage(persona),
  },
];

const parseTranscript = (raw: string | null | undefined, persona: Persona): ChatMessage[] => {
  if (!raw) return getStarter(persona);
  const messages = raw
    .split('|||')
    .map((content, idx) => ({
      role: idx % 2 === 0 ? 'assistant' : 'user',
      content: content.trim(),
    }))
    .filter((m) => m.content.length > 0) as ChatMessage[];

  return messages.length > 0 ? messages : getStarter(persona);
};

const serializeTranscript = (messages: ChatMessage[]) =>
  messages.map((m) => cleanForTranscript(m.content)).join('|||');

export default function StudentInterviewScreen() {
  const router = useRouter();
  const { studentId, sessionId } = useStudentState();
  const { width } = useWindowDimensions();
  const chatScrollRef = useRef<ScrollView | null>(null);
  const loadedRef = useRef(false);

  const [activePersonaId, setActivePersonaId] = useState(interviewPersonas[0].id);
  const [messagesByPersona, setMessagesByPersona] = useState<Record<string, ChatMessage[]>>(
    () =>
      interviewPersonas.reduce(
        (acc, persona) => ({
          ...acc,
          [persona.id]: getStarter(persona),
        }),
        {}
      )
  );
  const [savingPersonaId, setSavingPersonaId] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId || !sessionId) {
      router.replace('/student/name');
    }
  }, [studentId, sessionId, router]);

  const student = usefb(sessionId && studentId ? `sessions/${sessionId}/students/${studentId}` : null);
  const shoppingUnlocked = usefb(sessionId ? `sessions/${sessionId}/unlocked/shopping` : null);

  useEffect(() => {
    if (!student || loadedRef.current) return;
    loadedRef.current = true;
    setMessagesByPersona(
      interviewPersonas.reduce(
        (acc, persona) => ({
          ...acc,
          [persona.id]: parseTranscript(student.chats?.[persona.id], persona),
        }),
        {}
      )
    );
  }, [student]);

  const activePersona = useMemo(
    () =>
      interviewPersonas.find((persona) => persona.id === activePersonaId) ??
      interviewPersonas[0],
    [activePersonaId]
  );
  const activeMessages = messagesByPersona[activePersona.id] ?? getStarter(activePersona);
  const completedChats = interviewPersonas.filter((persona) => {
    const messages = messagesByPersona[persona.id] ?? [];
    return messages.some((message) => message.role === 'user');
  }).length;
  const isWide = width >= 760;

  useEffect(() => {
    requestAnimationFrame(() => {
      chatScrollRef.current?.scrollToEnd({ animated: true });
    });
  }, [activePersonaId, activeMessages.length]);

  const handleSend = async (question: string) => {
    const text = cleanForTranscript(question);
    if (!text || savingPersonaId) return;

    const persona = activePersona;
    const current = messagesByPersona[persona.id] ?? getStarter(persona);
    const nextMessages: ChatMessage[] = [
      ...current,
      { role: 'user', content: text },
      { role: 'assistant', content: makeInterviewReply(persona, text, current.length) },
    ];

    setMessagesByPersona((prev) => ({
      ...prev,
      [persona.id]: nextMessages,
    }));
    setSavingPersonaId(persona.id);

    try {
      await fw(
        update(ref(db, `sessions/${sessionId}/students/${studentId}`), {
          [`chats/${persona.id}`]: serializeTranscript(nextMessages),
          interviewUpdatedAt: Date.now(),
        })
      );
    } catch (e: any) {
      Alert.alert('Error saving chat', e.message);
    } finally {
      setSavingPersonaId(null);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <ProgressBar step="Interview" />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollcontent}>
        <Wide>
          <View style={[styles.layout, isWide && styles.layoutwide]}>
            <View style={[styles.peoplepane, isWide && styles.peoplepanewide]}>
              <Text style={styles.title}>Interview Residents</Text>
              <Text style={styles.subtitle}>
                {completedChats}/{interviewPersonas.length} chats started
              </Text>
              <View style={styles.personagrid}>
                {interviewPersonas.map((persona) => {
                  const selected = persona.id === activePersona.id;
                  const hasChat = (messagesByPersona[persona.id] ?? []).some(
                    (message) => message.role === 'user'
                  );
                  return (
                    <Pressable
                      key={persona.id}
                      onPress={() => setActivePersonaId(persona.id)}
                      style={({ pressed }) => [
                        styles.personacard,
                        selected && styles.personacardactive,
                        pressed && { opacity: 0.86 },
                      ]}
                    >
                      <Text style={styles.personaemoji}>{persona.emoji}</Text>
                      <View style={styles.personatextblock}>
                        <Text
                          style={[
                            styles.personaname,
                            selected && styles.personanameactive,
                          ]}
                          numberOfLines={1}
                        >
                          {persona.name}
                        </Text>
                        <Text
                          style={[
                            styles.personameta,
                            selected && styles.personametaactive,
                          ]}
                          numberOfLines={1}
                        >
                          Age {persona.age}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusdot,
                          { backgroundColor: hasChat ? c.green : c.greyLight },
                        ]}
                      />
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.chatpane}>
              <View style={styles.chatheader}>
                <View>
                  <Text style={styles.chatname}>
                    {activePersona.emoji} {activePersona.name}
                  </Text>
                  <Text style={styles.chatmeta}>Age {activePersona.age}</Text>
                </View>
                {savingPersonaId === activePersona.id && (
                  <ActivityIndicator color={c.teal} />
                )}
              </View>

              <ScrollView
                ref={chatScrollRef}
                style={styles.messagescroll}
                contentContainerStyle={styles.messages}
              >
                {activeMessages.map((message, idx) => {
                  const isUser = message.role === 'user';
                  return (
                    <View
                      key={`${message.role}-${idx}`}
                      style={[
                        styles.messagebubble,
                        isUser ? styles.userbubble : styles.assistantbubble,
                      ]}
                    >
                      <Text
                        style={[
                          styles.messagetext,
                          isUser && styles.usermessagetext,
                        ]}
                      >
                        {message.content}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>

              <View style={styles.quickrow}>
                {getInterviewQuickQuestions(activePersona.id).map((question) => (
                  <Pressable
                    key={question}
                    onPress={() => handleSend(question)}
                    disabled={!!savingPersonaId}
                    style={({ pressed }) => [
                      styles.quickchip,
                      pressed && { opacity: 0.82 },
                      !!savingPersonaId && styles.disabledchip,
                    ]}
                  >
                    <Text style={styles.quickchiptext}>{question}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {shoppingUnlocked === true ? (
            <Btn
              label="Continue to Shopping →"
              onPress={() => router.push('/student/shopping')}
              color={c.purple}
              textColor={c.white}
              style={styles.continuebutton}
            />
          ) : (
            <View style={styles.lockbox}>
              <Text style={styles.locktext}>Shopping unlocks when teacher is ready</Text>
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
    backgroundColor: c.offWhite,
  },
  scrollcontent: {
    padding: 18,
    paddingBottom: 28,
  },
  layout: {
    gap: 14,
  },
  layoutwide: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  peoplepane: {
    backgroundColor: c.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  peoplepanewide: {
    width: 280,
  },
  title: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 22,
    color: c.navy,
  },
  subtitle: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: c.grey,
    marginTop: 3,
    marginBottom: 12,
  },
  personagrid: {
    gap: 10,
  },
  personacard: {
    minHeight: 70,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: c.white,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  personacardactive: {
    borderColor: c.teal,
    backgroundColor: '#E9FBFA',
  },
  personaemoji: {
    fontSize: 28,
    width: 34,
    textAlign: 'center',
  },
  personatextblock: {
    flex: 1,
    minWidth: 0,
  },
  personaname: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
    color: c.navy,
  },
  personanameactive: {
    color: c.navy,
  },
  personameta: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: c.grey,
    marginTop: 1,
  },
  personametaactive: {
    color: c.greyDark,
  },
  statusdot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  chatpane: {
    flex: 1,
    minHeight: 560,
    backgroundColor: c.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  chatheader: {
    minHeight: 72,
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: c.navy,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  chatname: {
    fontFamily: 'DMSans_700Bold',
    color: c.white,
    fontSize: 20,
  },
  chatmeta: {
    fontFamily: 'DMSans_500Medium',
    color: c.tealLight,
    fontSize: 13,
    marginTop: 2,
  },
  messagescroll: {
    flex: 1,
    minHeight: 270,
    backgroundColor: c.offWhite,
  },
  messages: {
    padding: 16,
    gap: 10,
  },
  messagebubble: {
    maxWidth: '86%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  assistantbubble: {
    alignSelf: 'flex-start',
    backgroundColor: c.white,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  userbubble: {
    alignSelf: 'flex-end',
    backgroundColor: c.teal,
  },
  messagetext: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    lineHeight: 19,
    color: c.navy,
  },
  usermessagetext: {
    color: c.navy,
  },
  quickrow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  quickchip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#D6DBFF',
  },
  disabledchip: {
    opacity: 0.55,
  },
  quickchiptext: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 12,
    color: c.purpleMid,
  },
  continuebutton: {
    alignSelf: 'center',
    marginTop: 16,
  },
  lockbox: {
    alignItems: 'center',
    padding: 16,
  },
  locktext: {
    fontFamily: 'DMSans_500Medium',
    color: c.grey,
    fontSize: 13,
  },
});
