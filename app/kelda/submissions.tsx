// app/kelda/submissions.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { usefb, c } from '../../lib/helpers';
import { Wide, Btn, PsIcon } from '../../components/parts';

export default function KeldaSubmissionsScreen() {
  const router = useRouter();
  const activeSession = usefb('activeSession');
  const [showExportModal, setShowExportModal] = useState(false);

  const studentsData = usefb(
    activeSession?.id ? `sessions/${activeSession.id}/students` : null
  );

  if (activeSession === undefined || studentsData === undefined) {
    return (
      <View style={styles.loadingroot}>
        <ActivityIndicator color={c.navy} size="large" />
      </View>
    );
  }

  if (!activeSession) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.navbar}>
          <Pressable onPress={() => router.replace('/kelda/dashboard')} style={styles.backbutton}>
            <Text style={styles.backtext}>← Back</Text>
          </Pressable>
          <Text style={styles.navbartitle}>Submissions</Text>
        </View>
        <View style={styles.emptycontainer}>
          <Text style={styles.emptytext}>No active session found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const students = studentsData ? Object.values(studentsData) : [];

  const getExportCSV = () => {
    let csv = 'Student Name,Status,Reflection,Items Bought,Items Borrowed\n';
    students.forEach((s: any) => {
      const name = `"${s.name?.replace(/"/g, '""') || ''}"`;
      const status = s.submitted ? 'Submitted' : 'In Progress';
      const reflection = `"${s.reflection?.replace(/"/g, '""') || ''}"`;

      const boughtList = s.bought
        ? Object.entries(s.bought)
            .filter(([_, qty]) => (qty as number) > 0)
            .map(([id, qty]) => `${id}(x${qty})`)
            .join('; ')
        : '';

      const borrowedList = s.borrowed
        ? Object.entries(s.borrowed)
            .filter(([_, qty]) => (qty as number) > 0)
            .map(([id, qty]) => `${id}(x${qty})`)
            .join('; ')
        : '';

      csv += `${name},${status},${reflection},"${boughtList}","${borrowedList}"\n`;
    });
    return csv;
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Header bar */}
      <View style={styles.navbar}>
        <Pressable onPress={() => router.replace('/kelda/dashboard')} style={styles.backbutton}>
          <Text style={styles.backtext}>← Back</Text>
        </Pressable>
        <Text style={styles.navbartitle}>Student Submissions</Text>
        {students.length > 0 && (
          <Pressable
            onPress={() => setShowExportModal(!showExportModal)}
            style={styles.exportheaderbtn}
          >
            <Text style={styles.exportheaderbtntext}>
              {showExportModal ? 'Close CSV' : 'Export CSV'}
            </Text>
          </Pressable>
        )}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollcontent}>
        <Wide>
          {showExportModal && (
            <View style={styles.csvmodal}>
              <Text style={styles.csvmodaltitle}>Copy-Paste Session CSV Data</Text>
              <Text style={styles.csvmodaldesc}>
                Select and copy the text below to import into Excel or Google Sheets.
              </Text>
              <ScrollView style={styles.csvboxcontainer} nestedScrollEnabled={true}>
                <Text style={styles.csvcodetext} selectable={true}>
                  {getExportCSV()}
                </Text>
              </ScrollView>
            </View>
          )}

          <Text style={styles.sectionheader}>
            Students Joined ({students.length})
          </Text>

          <View style={styles.listcontainer}>
            {students.map((s: any) => {
              const boughtCount = s.bought
                ? Object.values(s.bought).reduce((acc: number, val: any) => acc + (val || 0), 0)
                : 0;
              const borrowedCount = s.borrowed
                ? Object.values(s.borrowed).reduce((acc: number, val: any) => acc + (val || 0), 0)
                : 0;
              const chatCount = s.chats ? Object.keys(s.chats).length : 0;
              const hasReflection = !!s.reflection;

              return (
                <Pressable
                  key={s.id}
                  onPress={() =>
                    router.push({
                      pathname: '/kelda/student-detail',
                      params: { studentId: s.id },
                    })
                  }
                  style={({ pressed }) => [
                    styles.studentcard,
                    pressed && styles.studentcardpressed,
                  ]}
                >
                  <View style={styles.cardheader}>
                    <Text style={styles.studentname}>{s.name}</Text>
                    <View
                      style={[
                        styles.statusbadge,
                        { backgroundColor: s.submitted ? c.green : c.grey },
                      ]}
                    >
                      <Text style={styles.statusbadgetext}>
                        {s.submitted ? 'Submitted' : 'In Progress'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardstatsgrid}>
                    <View style={styles.statminicard}>
                      <View style={styles.statvalrow}>
                        <PsIcon name="grocery" size={18} />
                        <Text style={styles.statval}>{boughtCount}</Text>
                      </View>
                      <Text style={styles.statlabel}>Bought</Text>
                    </View>
                    <View style={styles.statminicard}>
                      <Text style={styles.statval}>🌱 {borrowedCount}</Text>
                      <Text style={styles.statlabel}>Borrowed</Text>
                    </View>
                    <View style={styles.statminicard}>
                      <Text style={styles.statval}>💬 {chatCount}</Text>
                      <Text style={styles.statlabel}>Chats</Text>
                    </View>
                    <View style={styles.statminicard}>
                      <PsIcon name={hasReflection ? 'complete' : 'forbidden'} size={18} />
                      <Text style={styles.statlabel}>Reflection</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}

            {students.length === 0 && (
              <View style={styles.nostudentsbox}>
                <Text style={styles.nostudentstext}>
                  No students have joined this session yet.
                </Text>
              </View>
            )}
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
  exportheaderbtn: {
    backgroundColor: c.yellow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  exportheaderbtntext: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 12,
    color: c.navy,
  },
  scrollcontent: {
    padding: 24,
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
  csvmodal: {
    backgroundColor: c.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  csvmodaltitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 18,
    color: c.navy,
    marginBottom: 4,
  },
  csvmodaldesc: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: c.grey,
    marginBottom: 12,
  },
  csvboxcontainer: {
    maxHeight: 200,
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  csvcodetext: {
    fontFamily: 'Courier',
    fontSize: 11,
    color: c.navy,
  },
  sectionheader: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 18,
    color: c.navy,
    marginBottom: 16,
  },
  listcontainer: {
    gap: 16,
  },
  studentcard: {
    backgroundColor: c.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  studentcardpressed: {
    opacity: 0.85,
    backgroundColor: '#FAFAFA',
  },
  cardheader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  studentname: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 18,
    color: c.navy,
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
  cardstatsgrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statminicard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statval: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
    color: c.navy,
  },
  statvalrow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  statlabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 10,
    color: c.grey,
    marginTop: 2,
  },
  nostudentsbox: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nostudentstext: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: c.grey,
  },
});
