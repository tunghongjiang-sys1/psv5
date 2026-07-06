import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { usefb, c } from '../../lib/helpers';
import { PsIcon } from '../../components/parts';
import { StudentProfilePanel } from './student-detail';

const SIDEBAR_WIDTH = 320;

export default function KeldaSubmissionsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 880;

  const activeSession = usefb('activeSession');
  const studentsData = usefb(
    activeSession?.id ? `sessions/${activeSession.id}/students` : null
  );

  const [search, setSearch] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const students = useMemo(
    () => (studentsData ? Object.values(studentsData) : []) as any[],
    [studentsData]
  );

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => {
      const name = String(s?.name ?? '').toLowerCase();
      return name.includes(q);
    });
  }, [students, search]);

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedId) ?? null,
    [students, selectedId]
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

  const getExportCSV = () => {
    let csv = 'Student Name,Status,Reflection,Items Bought,Items Borrowed\\n';
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

      csv += `${name},${status},${reflection},"${boughtList}","${borrowedList}"\\n`;
    });
    return csv;
  };

  const handleSelect = (id: string) => {
    if (isWide) {
      setSelectedId(id);
    } else {
      router.push({
        pathname: '/kelda/student-detail',
        params: { studentId: id },
      });
    }
  };

  const renderNavbar = () => (
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
  );

  const renderExportModal = () =>
    showExportModal ? (
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
    ) : null;

  const renderStudentRow = (s: any, compact = false) => {
    const boughtCount = s.bought
      ? Object.values(s.bought).reduce((acc: number, val: any) => acc + (val || 0), 0)
      : 0;
    const borrowedCount = s.borrowed
      ? Object.values(s.borrowed).reduce((acc: number, val: any) => acc + (val || 0), 0)
      : 0;
    const chatCount = s.chats ? Object.keys(s.chats).length : 0;
    const hasReflection = !!s.reflection;
    const isSelected = selectedId === s.id;

    return (
      <Pressable
        key={s.id}
        onPress={() => handleSelect(s.id)}
        style={({ pressed }) => [
          compact ? styles.sidebarlistitem : styles.studentcard,
          isSelected && (compact ? styles.sidebarlistitemselected : styles.studentcardselected),
          pressed && (compact ? styles.sidebarlistpressed : styles.studentcardpressed),
        ]}
      >
        <View style={styles.cardheader}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={[compact ? styles.sidebaritemname : styles.studentname, isSelected && { color: c.white }]}
              numberOfLines={1}
            >
              {s.name?.trim() ? s.name : '(unnamed student)'}
            </Text>
            {compact && (
              <Text style={styles.sidebaritemmeta} numberOfLines={1}>
                {s.submitted ? 'Submitted' : 'In progress'} · {boughtCount} bought · {chatCount} chats
              </Text>
            )}
          </View>
          <View
            style={[
              styles.statusbadge,
              {
                backgroundColor: isSelected
                  ? c.white
                  : s.submitted
                    ? c.green
                    : c.grey,
              },
            ]}
          >
            <Text
              style={[
                styles.statusbadgetext,
                isSelected && { color: c.navy },
              ]}
            >
              {s.submitted ? 'Submitted' : 'In Progress'}
            </Text>
          </View>
        </View>

        {!compact && (
          <View style={styles.cardstatsgrid}>
            <View style={styles.statminicard}>
              <View style={styles.statvalrow}>
                <PsIcon name="grocery" size={18} />
                <Text style={styles.statval}>{boughtCount}</Text>
              </View>
              <Text style={styles.statlabel}>Bought</Text>
            </View>
            <View style={styles.statminicard}>
              <Text style={styles.statval}>{borrowedCount}</Text>
              <Text style={styles.statlabel}>Borrowed</Text>
            </View>
            <View style={styles.statminicard}>
              <Text style={styles.statval}>{chatCount}</Text>
              <Text style={styles.statlabel}>Chats</Text>
            </View>
            <View style={styles.statminicard}>
              <PsIcon name={hasReflection ? 'complete' : 'forbidden'} size={18} />
              <Text style={styles.statlabel}>Reflection</Text>
            </View>
          </View>
        )}
      </Pressable>
    );
  };

  if (!isWide) {
    return (
      <SafeAreaView style={styles.root}>
        {renderNavbar()}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollcontent}>
          {renderExportModal()}
          <Text style={styles.sectionheader}>Students Joined ({students.length})</Text>
          <View style={styles.listcontainer}>
            {students.map((s) => renderStudentRow(s, false))}
            {students.length === 0 && (
              <View style={styles.nostudentsbox}>
                <Text style={styles.nostudentstext}>
                  No students have joined this session yet.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      {renderNavbar()}
      <View style={styles.masterDetail}>
        <View style={styles.sidebar}>
          <View style={styles.sidebarHeader}>
            <Text style={styles.sidebarHeadertitle}>Students</Text>
            <Text style={styles.sidebarHeadersubtitle}>
              {filteredStudents.length} of {students.length}
            </Text>
          </View>
          <View style={styles.searchwrap}>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search by name..."
              placeholderTextColor={c.greyLight}
              style={styles.searchinput}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')} style={styles.searchclear}>
                <Text style={styles.searchcleartext}>×</Text>
              </Pressable>
            )}
          </View>
          <ScrollView
            style={styles.sidebarlist}
            contentContainerStyle={styles.sidebarlistcontent}
            keyboardShouldPersistTaps="handled"
          >
            {filteredStudents.map((s) => renderStudentRow(s, true))}
            {filteredStudents.length === 0 && (
              <View style={styles.sidebarempty}>
                <Text style={styles.sidebaremptytext}>
                  {students.length === 0
                    ? 'No students have joined this session yet.'
                    : 'No students match your search.'}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>

        <View style={styles.detailpane}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.detailcontent}>
            {renderExportModal()}
            {selectedStudent ? (
              <StudentProfilePanel
                key={selectedStudent.id}
                student={selectedStudent}
                studentsData={studentsData}
              />
            ) : (
              <View style={styles.detailempty}>
                <View style={styles.detailemptyiconwrap}>
                  <PsIcon name="forbidden" size={32} />
                </View>
                <Text style={styles.detailemptytitle}>Select a student</Text>
                <Text style={styles.detailemptydesc}>
                  Pick a name from the left to view their session details, including whiteboard,
                  reflections, and chat logs.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
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
  studentcardselected: {
    borderColor: c.teal,
    backgroundColor: '#E9FBFA',
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

  masterDetail: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: c.white,
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  sidebarHeader: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  sidebarHeadertitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    color: c.navy,
  },
  sidebarHeadersubtitle: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: c.grey,
  },
  searchwrap: {
    marginHorizontal: 14,
    marginBottom: 12,
    position: 'relative',
  },
  searchinput: {
    backgroundColor: '#F1F4F9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: c.navy,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchclear: {
    position: 'absolute',
    right: 6,
    top: 6,
    bottom: 6,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchcleartext: {
    color: c.grey,
    fontSize: 18,
    fontFamily: 'DMSans_700Bold',
  },
  sidebarlist: {
    flex: 1,
  },
  sidebarlistcontent: {
    paddingHorizontal: 10,
    paddingBottom: 24,
  },
  sidebarlistitem: {
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'transparent',
    marginBottom: 4,
  },
  sidebarlistitemselected: {
    backgroundColor: c.navy,
  },
  sidebarlistpressed: {
    opacity: 0.85,
  },
  sidebaritemname: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
    color: c.navy,
  },
  sidebaritemmeta: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: c.grey,
    marginTop: 2,
  },
  sidebarempty: {
    padding: 24,
    alignItems: 'center',
  },
  sidebaremptytext: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: c.grey,
    textAlign: 'center',
  },
  detailpane: {
    flex: 1,
    backgroundColor: c.offWhite,
  },
  detailcontent: {
    padding: 24,
  },
  detailempty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
    minHeight: 360,
  },
  detailemptyiconwrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: c.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  detailemptytitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 18,
    color: c.navy,
    marginBottom: 6,
  },
  detailemptydesc: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: c.grey,
    textAlign: 'center',
    maxWidth: 360,
  },
});
