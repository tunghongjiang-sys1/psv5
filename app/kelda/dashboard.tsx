import React, {useEffect} from 'react';
import {View,Text,StyleSheet,SafeAreaView,ScrollView,ActivityIndicator,Pressable,} from 'react-native';
import {useRouter} from 'expo-router';
import {usefb, c} from '../../lib/helpers';
import {Mascot, PsIcon, Wide, Btn} from '../../components/parts';
import {useKeldaState, keldaState} from '../../lib/keldaState';

export default function TeacherHomeScreen() {
  const router = useRouter();
  const {isUnlocked} = useKeldaState();

  useEffect(() => {
    if (!isUnlocked) {
      router.replace('/kelda/login');
    }
  }, [isUnlocked, router]);

  const handleLogout = () => {
    keldaState.clear();
    router.replace('/');
  };

  const session = usefb('activeSession');

  const studdata = usefb(session?.id ? `sessions/${session.id}/students` : null);
  const stud = studdata ? Object.values(studdata) : [];
  const totalstud = stud.length;
  const subcount = stud.filter((s: any) => s.submitted).length;

  const unlocked = usefb(session?.id ? `sessions/${session.id}/unlocked` : null);

  if (session === undefined) {
    return (
      <View style={styles.loadingroot}>
        <ActivityIndicator color={c.navy} size="large" />
      </View>
    );
  }

  const isActive = session && session.status === 'active';

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.navbar}>
        <Pressable onPress={handleLogout} style={styles.backbutton}>
          <Text style={styles.backtext}>← Logout</Text>
        </Pressable>
        <Mascot size={48} />
        <View style={styles.navbarinfo}>
          <Text style={styles.navbartitle}>Teacher Dashboard</Text>
          <Text style={styles.navbarsubtitle}>Loopie Town Controls</Text>
        </View>
      </View>

      <ScrollView style={{flex: 1}} contentContainerStyle={styles.scrollcontent}>
        <Wide>
          {isActive ? (
            <View style={styles.dashboardcontainer}>
              <View style={styles.activebanner}>
                <PsIcon name="complete" size={22} />
                <Text style={styles.activebannertext}>
                  Session Active - Budget: ${session.budget}
                </Text>
              </View>

              <View style={styles.statsrow}>
                <View style={styles.statscard}>
                  <Text style={styles.statsnumber}>{totalstud}</Text>
                  <Text style={styles.statslabel}>Students Joined</Text>
                </View>
                <View style={styles.statscard}>
                  <Text style={styles.statsnumber}>
                    {subcount}/{totalstud}
                  </Text>
                  <Text style={styles.statslabel}>Submissions</Text>
                </View>
              </View>

              <View style={styles.statuscard}>
                <Text style={styles.statusheading}>Current Session Progress</Text>
                <View style={styles.statusrow}>
                  <Text style={styles.statuslabelname}>Interview Phase:</Text>
                  <View style={styles.statusvalrow}>
                    <Text
                      style={[
                        styles.statusval,
                        unlocked?.interview ? styles.valunlocked : styles.vallocked,
                      ]}
                    >
                      {unlocked?.interview ? 'Unlocked' : 'Locked'}
                    </Text>
                    <PsIcon name={unlocked?.interview ? 'padlockUnlock' : 'padlock'} size={16} />
                  </View>
                </View>
                <View style={styles.statusrow}>
                  <Text style={styles.statuslabelname}>Plan Logistics Phase:</Text>
                  <View style={styles.statusvalrow}>
                    <Text
                      style={[
                        styles.statusval,
                        unlocked?.shopping ? styles.valunlocked : styles.vallocked,
                      ]}
                    >
                      {unlocked?.shopping ? 'Unlocked' : 'Locked'}
                    </Text>
                    <PsIcon name={unlocked?.shopping ? 'padlockUnlock' : 'padlock'} size={16} />
                  </View>
                </View>
                <View style={styles.statusrow}>
                  <Text style={styles.statuslabelname}>Reflections Phase:</Text>
                  <View style={styles.statusvalrow}>
                    <Text
                      style={[
                        styles.statusval,
                        unlocked?.reflections ? styles.valunlocked : styles.vallocked,
                      ]}
                    >
                      {unlocked?.reflections ? 'Unlocked' : 'Locked'}
                    </Text>
                    <PsIcon name={unlocked?.reflections ? 'padlockUnlock' : 'padlock'} size={16} />
                  </View>
                </View>
                <View style={styles.statusrow}>
                  <Text style={styles.statuslabelname}>Summary Phase:</Text>
                  <View style={styles.statusvalrow}>
                    <Text
                      style={[
                        styles.statusval,
                        unlocked?.summary ? styles.valunlocked : styles.vallocked,
                      ]}
                    >
                      {unlocked?.summary ? 'Unlocked' : 'Locked'}
                    </Text>
                    <PsIcon name={unlocked?.summary ? 'padlockUnlock' : 'padlock'} size={16} />
                  </View>
                </View>
              </View>

              <View style={styles.controlsblock}>
                <Btn
                  label="Controls"
                  onPress={() => router.push('/kelda/session')}
                  color={c.purple}
                  textColor={c.white}
                  style={{width: '100%', marginTop: 16}}
                  icon="settings"
                />
                <Btn
                  label="Submissions"
                  onPress={() => router.push('/kelda/submissions')}
                  color={c.navy}
                  textColor={c.white}
                  style={{width: '100%', marginTop: 12}}
                  icon="checklist"
                />
              </View>
            </View>
          ) : (
            <View style={styles.inactivecontainer}>
              <View style={styles.inactivebanner}>
                <Text style={styles.inactivebannertext}>No active session. Start one below!</Text>
              </View>
              <Btn
                label="Start a New Session"
                onPress={() => router.push('/kelda/session')}
                color={c.orange}
                textColor={c.white}
                style={{width: '100%', marginTop: 16}}
              />
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
    backgroundColor: c.offWhite,
  },
  root: {
    flex: 1,
    backgroundColor: c.offWhite,
  },
  navbar: {
    backgroundColor: c.navy,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backbutton: {
    marginRight: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  backtext: {
    color: c.yellow,
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
  },
  navbarinfo: {
    flex: 1,
  },
  navbartitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 22,
    color: c.white,
  },
  navbarsubtitle: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: c.greyLight,
  },
  scrollcontent: {
    padding: 24,
    gap: 16,
  },
  dashboardcontainer: {
    gap: 16,
  },
  activebanner: {
    backgroundColor: c.green,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  activebannertext: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
    color: c.white,
  },
  statsrow: {
    flexDirection: 'row',
    gap: 16,
  },
  statscard: {
    flex: 1,
    backgroundColor: c.white,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statsnumber: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 32,
    color: c.navy,
  },
  statslabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: c.grey,
    marginTop: 4,
  },
  statuscard: {
    backgroundColor: c.white,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  statusheading: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    color: c.navy,
    marginBottom: 4,
  },
  statusrow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 8,
  },
  statuslabelname: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: c.greyDark,
  },
  statusval: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
  },
  statusvalrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  valunlocked: {
    color: c.green,
  },
  vallocked: {
    color: c.grey,
  },
  controlsblock: {
    width: '100%',
  },
  inactivecontainer: {
    gap: 16,
  },
  inactivebanner: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 14,
  },
  inactivebannertext: {
    fontFamily: 'DMSans_700Bold',
    color: '#856404',
  },
});
