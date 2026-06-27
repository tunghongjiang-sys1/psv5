// app/kelda/student-detail.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { usefb, itemsbuy, itemsbor, defpers, c } from '../../lib/helpers';
import { Wide, PsIcon } from '../../components/parts';

export default function KeldaStudentDetailScreen() {
  const router = useRouter();
  const { studentId } = useLocalSearchParams<{ studentId: string }>();
  const activeSession = usefb('activeSession');

  // Load student detail and full students list (to map preferred group IDs to names)
  const student = usefb(
    activeSession?.id && studentId ? `sessions/${activeSession.id}/students/${studentId}` : null
  );
  const studentsData = usefb(activeSession?.id ? `sessions/${activeSession.id}/students` : null);

  const [openChatPersona, setOpenChatPersona] = useState<string | null>(null);

  if (activeSession === undefined || student === undefined || studentsData === undefined) {
    return (
      <View style={styles.loadingroot}>
        <ActivityIndicator color={c.navy} size="large" />
      </View>
    );
  }

  if (!activeSession || !student) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.navbar}>
          <Pressable onPress={() => router.replace('/kelda/submissions')} style={styles.backbutton}>
            <Text style={styles.backtext}>← Back</Text>
          </Pressable>
          <Text style={styles.navbartitle}>Student Detail</Text>
        </View>
        <View style={styles.emptycontainer}>
          <Text style={styles.emptytext}>Student not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const students = studentsData ? Object.values(studentsData) : [];

  // Map preferred student IDs to names
  const preferredGroupIds: string[] = student.preferredGroup || [];
  const preferredNames = preferredGroupIds
    .map((id) => {
      const match: any = students.find((st: any) => st.id === id);
      return match ? match.name : id;
    })
    .join(', ');

  const boughtItems = itemsbuy.filter((i) => (student.bought || {})[i.id] > 0);
  const borrowedItems = itemsbor.filter((i) => (student.borrowed || {})[i.id] > 0);

  // Parse chat dialogue
  const getChatMessages = (pid: string): { role: string; content: string }[] => {
    const raw = student.chats?.[pid];
    if (!raw) return [];
    const parts = raw.split('|||');
    return parts.map((content: string, idx: number) => ({
      role: idx % 2 === 0 ? 'assistant' : 'user',
      content,
    }));
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Header bar */}
      <View style={styles.navbar}>
        <Pressable onPress={() => router.replace('/kelda/submissions')} style={styles.backbutton}>
          <Text style={styles.backtext}>← Back</Text>
        </Pressable>
        <Text style={styles.navbartitle}>{student.name}'s Profile</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollcontent}>
        <Wide>
          {/* Header Info */}
          <View style={styles.profileheadercard}>
            <Text style={styles.profilename}>{student.name}</Text>
            <View style={styles.metarow}>
              <View
                style={[
                  styles.statusbadge,
                  { backgroundColor: student.submitted ? c.green : c.grey },
                ]}
              >
                <Text style={styles.statusbadgetext}>
                  {student.submitted ? 'Submitted' : 'In Progress'}
                </Text>
              </View>
              {student.joinedAt && (
                <Text style={styles.joinedtime}>
                  Joined: {new Date(student.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              )}
            </View>
          </View>

          {/* Preferred Grouping */}
          <View style={styles.sectioncard}>
            <Text style={styles.sectiontitle}>🤝 Preferred Group Members</Text>
            <Text style={styles.sectioncontent}>
              {preferredNames || 'No preferences selected'}
            </Text>
          </View>

          {/* Items bought & borrowed */}
          <View style={styles.shoppingsection}>
            <View style={[styles.sectioncard, { flex: 1 }]}>
              <View style={styles.sectiontitlerow}>
                <PsIcon name="grocery" size={20} />
                <Text style={styles.sectiontitlerowtext}>Items Bought</Text>
              </View>
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

            <View style={[styles.sectioncard, { flex: 1 }]}>
              <Text style={styles.sectiontitle}>🌱 Items Borrowed</Text>
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

          {/* Elder Chats */}
          <View style={styles.sectioncard}>
            <Text style={styles.sectiontitle}>💬 Conversations with Residents</Text>
            <Text style={styles.chatsectiondesc}>Tapping on a resident below reveals their chat log.</Text>
            {defpers.map((p) => {
              const messages = getChatMessages(p.id);
              const isOpen = openChatPersona === p.id;
              const hasChat = messages.length > 0;

              return (
                <View key={p.id} style={styles.chatpersonarow}>
                  <Pressable
                    onPress={() => hasChat && setOpenChatPersona(isOpen ? null : p.id)}
                    style={styles.chatpersonaheader}
                    disabled={!hasChat}
                  >
                    <Text style={styles.chatpersonaname}>
                      {p.emoji} {p.name}
                    </Text>
                    {hasChat ? (
                      <Text style={styles.chattoggleindicator}>
                        {isOpen ? '▲ Hide Log' : '▼ View Log'} ({messages.length} msgs)
                      </Text>
                    ) : (
                      <Text style={styles.nochattext}>No chat started</Text>
                    )}
                  </Pressable>

                  {isOpen && hasChat && (
                    <View style={styles.chatlogcontainer}>
                      {messages.map((m, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.chatbubble,
                            {
                              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                              backgroundColor: m.role === 'user' ? c.yellow : c.teal,
                            },
                          ]}
                        >
                          <Text style={styles.chatbubbletext}>{m.content}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* Reflection */}
          <View style={styles.sectioncard}>
            <Text style={styles.sectiontitle}>📝 Final Reflection</Text>
            <View style={styles.reflectionbox}>
              <Text style={styles.reflectionprompt}>
                What have you learnt from this experience?
              </Text>
              <Text style={styles.reflectioncontent}>
                {student.reflection || 'No reflection submitted yet'}
              </Text>
            </View>
          </View>
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
    backgroundColor: c.offWhite,
  },
  root: {
    flex: 1,
    backgroundColor: c.offWhite,
  },
  navbar: {
    backgroundColor: c.navy,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backbutton: {
    marginRight: 8,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  backtext: {
    color: c.yellow,
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
  },
  navbartitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 20,
    color: c.white,
    flex: 1,
  },
  scrollcontent: {
    padding: 24,
    gap: 16,
  },
  emptycontainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptytext: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 16,
    color: c.grey,
  },
  profileheadercard: {
    backgroundColor: c.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 16,
  },
  profilename: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 24,
    color: c.navy,
  },
  metarow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  statusbadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusbadgetext: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 11,
    color: c.white,
  },
  joinedtime: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: c.grey,
  },
  sectioncard: {
    backgroundColor: c.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 16,
  },
  sectiontitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    color: c.navy,
    marginBottom: 10,
  },
  sectiontitlerow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectiontitlerowtext: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    color: c.navy,
  },
  sectioncontent: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: c.black,
  },
  shoppingsection: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
    marginBottom: 0,
  },
  itemrow: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: c.navy,
    marginBottom: 4,
  },
  chatsectiondesc: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: c.grey,
    marginBottom: 12,
  },
  chatpersonarow: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 10,
  },
  chatpersonaheader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  chatpersonaname: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
    color: c.navy,
  },
  chattoggleindicator: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 12,
    color: c.purple,
  },
  nochattext: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: c.greyLight,
  },
  chatlogcontainer: {
    backgroundColor: '#DDDDE8',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    gap: 8,
  },
  chatbubble: {
    maxWidth: '85%',
    padding: 10,
    borderRadius: 14,
  },
  chatbubbletext: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: c.navy,
  },
  reflectionbox: {
    backgroundColor: '#DDD',
    borderRadius: 12,
    padding: 14,
  },
  reflectionprompt: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
    color: c.navy,
    marginBottom: 4,
  },
  reflectioncontent: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: c.black,
    lineHeight: 18,
  },
});
