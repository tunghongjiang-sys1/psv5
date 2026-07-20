import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Pressable,
} from 'react-native';
import {useRouter} from 'expo-router';
import {db, ref, set, update, remove} from '../../lib/firebaseConfig';
import {usefb, fw, c, showConfirm, showAlert} from '../../lib/helpers';
import {Wide, Btn, PsIcon} from '../../components/parts';
import {useKeldaState} from '../../lib/keldaState';

export default function KeldaSessionScreen() {
  const router = useRouter();
  const {isUnlocked} = useKeldaState();

  useEffect(() => {
    if (!isUnlocked) {
      router.replace('/kelda/login');
    }
  }, [isUnlocked, router]);

  const [budgetInput, setBudgetInput] = useState('50');
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);

  const activeSession = usefb('activeSession');
  const sessionData = usefb(activeSession?.id ? `sessions/${activeSession.id}` : null);

  const [interview, setInterview] = useState(false);
  const [shopping, setShopping] = useState(false);
  const [reflections, setReflections] = useState(false);
  const [summary, setSummary] = useState(false);

  const [qList, setQList] = useState<string[]>([
    'What did you learn about planning with seniors in mind?',
    'Which idea from your group could make the biggest impact, and why?',
    'What would you improve if you had more time?',
  ]);
  const [newQText, setNewQText] = useState('');

  useEffect(() => {
    if (sessionData?.unlocked) {
      setInterview(!!sessionData.unlocked.interview);
      setShopping(!!sessionData.unlocked.shopping);
      setReflections(!!sessionData.unlocked.reflections);
      setSummary(!!sessionData.unlocked.summary);
    }
    if (sessionData?.reflectionQuestions) {
      const parsed = Array.isArray(sessionData.reflectionQuestions)
        ? sessionData.reflectionQuestions
        : Object.values(sessionData.reflectionQuestions);
      setQList(parsed);
    }
  }, [sessionData]);

  const saveReflectionQuestions = async (updated: string[]) => {
    if (!activeSession?.id) return;
    try {
      await update(ref(db, `sessions/${activeSession.id}`), {
        reflectionQuestions: updated,
      });
      setQList(updated);
    } catch (e: any) {
      Alert.alert('Error saving questions', e.message);
    }
  };

  const addQuestion = () => {
    if (!newQText.trim()) return;
    const next = [...qList, newQText.trim()];
    saveReflectionQuestions(next);
    setNewQText('');
  };

  const removeQuestion = (idx: number) => {
    if (qList.length <= 1) {
      Alert.alert('Must keep at least 1 question!');
      return;
    }
    const next = qList.filter((_, i) => i !== idx);
    saveReflectionQuestions(next);
  };

  const startSession = async () => {
    if (starting) return;
    setStarting(true);
    try {
      const b = parseInt(budgetInput) || 50;
      const sid = 'session_' + Date.now();
      await fw(
        set(ref(db, `sessions/${sid}`), {
          id: sid,
          budget: b,
          startedAt: Date.now(),
          unlocked: {
            interview: false,
            shopping: false,
            reflections: false,
            summary: false,
          },
          students: {},
        }),
      );
      await fw(
        set(ref(db, 'activeSession'), {
          id: sid,
          status: 'active',
          budget: b,
          startedAt: Date.now(),
        }),
      );
    } catch (e: any) {
      Alert.alert('Error starting session', e.message);
    } finally {
      setStarting(false);
    }
  };

  const togglePhase = async (
    phase: 'interview' | 'shopping' | 'reflections' | 'summary',
    currentVal: boolean,
  ) => {
    if (!activeSession?.id) return;
    const nextVal = !currentVal;
    try {
      await update(ref(db, `sessions/${activeSession.id}/unlocked`), {
        [phase]: nextVal,
      });
    } catch (e: any) {
      Alert.alert('Error toggling phase', e.message);
    }
  };

  const endSession = async () => {
    if (ending) return;
    showConfirm(
      'End Session',
      'Are you sure you want to end this session? Students will no longer be able to submit their work.',
      async () => {
        setEnding(true);
        try {
          if (activeSession?.id) {
            await fw(remove(ref(db, 'activeSession')));
          }
          router.replace('/kelda/dashboard');
        } catch (e: any) {
          showAlert('Error ending session', e.message);
          setEnding(false);
        }
      },
    );
  };

  if (activeSession === undefined) {
    return (
      <View style={styles.loadingroot}>
        <ActivityIndicator color={c.navy} size="large" />
      </View>
    );
  }

  const isActive = activeSession && activeSession.status === 'active';

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.navbar}>
        <Pressable onPress={() => router.replace('/kelda/dashboard')} style={styles.backbutton}>
          <Text style={styles.backtext}>← Back</Text>
        </Pressable>
        <Text style={styles.navbartitle}>
          {isActive ? 'Session Controls' : 'Configure New Session'}
        </Text>
      </View>

      <ScrollView style={{flex: 1}} contentContainerStyle={styles.scrollcontent}>
        <Wide>
          {isActive ? (
            <View style={styles.controlslayout}>
              <Text style={styles.infotitle}>Session ID: {activeSession.id}</Text>
              <Text style={styles.infosubtitle}>
                Configure what students can access in real-time.
              </Text>

              <View style={styles.phasecard}>
                <View style={styles.phaserow}>
                  <View style={styles.phaseinfo}>
                    <Text style={styles.phasename}>1. Groupings / Entrance</Text>
                    <Text style={styles.phasedesc}>
                      Students choose up to 5 peers. Auto-applies once everyone submits, or visit
                      Manage Groupings to assign early.
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => router.push('/kelda/groupings')}
                    style={({pressed}) => [
                      styles.togglebtn,
                      {backgroundColor: c.purple},
                      pressed && {opacity: 0.8},
                    ]}
                  >
                    <Text style={styles.togglebtntext}>Manage ›</Text>
                    <PsIcon name="settings" size={16} />
                  </Pressable>
                </View>

                <View style={styles.phaserow}>
                  <View style={styles.phaseinfo}>
                    <Text style={styles.phasename}>2. Interview/Map Phase</Text>
                    <Text style={styles.phasedesc}>Elders chat interfaces and neighborhood</Text>
                  </View>
                  <Pressable
                    onPress={() => togglePhase('interview', interview)}
                    style={({pressed}) => [
                      styles.togglebtn,
                      {backgroundColor: interview ? c.teal : c.grey},
                      pressed && {opacity: 0.8},
                    ]}
                  >
                    <Text style={styles.togglebtntext}>{interview ? 'Unlocked' : 'Locked'}</Text>
                    <PsIcon name={interview ? 'padlockUnlock' : 'padlock'} size={16} />
                  </Pressable>
                </View>

                <View style={styles.phaserow}>
                  <View style={styles.phaseinfo}>
                    <Text style={styles.phasename}>3. Plan Logistics Phase</Text>
                    <Text style={styles.phasedesc}>
                      Budget spending, buying and active aging centre borrowing
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => togglePhase('shopping', shopping)}
                    style={({pressed}) => [
                      styles.togglebtn,
                      {backgroundColor: shopping ? c.teal : c.grey},
                      pressed && {opacity: 0.8},
                    ]}
                  >
                    <Text style={styles.togglebtntext}>{shopping ? 'Unlocked' : 'Locked'}</Text>
                    <PsIcon name={shopping ? 'padlockUnlock' : 'padlock'} size={16} />
                  </Pressable>
                </View>

                <View style={styles.phaserow}>
                  <View style={styles.phaseinfo}>
                    <Text style={styles.phasename}>4. Reflections Phase</Text>
                    <Text style={styles.phasedesc}>
                      Write reflection and view other reflections
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => togglePhase('reflections', reflections)}
                    style={({pressed}) => [
                      styles.togglebtn,
                      {backgroundColor: reflections ? c.teal : c.grey},
                      pressed && {opacity: 0.8},
                    ]}
                  >
                    <Text style={styles.togglebtntext}>{reflections ? 'Unlocked' : 'Locked'}</Text>
                    <PsIcon name={reflections ? 'padlockUnlock' : 'padlock'} size={16} />
                  </Pressable>
                </View>

                <View style={styles.phaserow}>
                  <View style={styles.phaseinfo}>
                    <Text style={styles.phasename}>5. Summary Phase</Text>
                    <Text style={styles.phasedesc}>
                      Confirm and finalize student submissions and ratings
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => togglePhase('summary', summary)}
                    style={({pressed}) => [
                      styles.togglebtn,
                      {backgroundColor: summary ? c.teal : c.grey},
                      pressed && {opacity: 0.8},
                    ]}
                  >
                    <Text style={styles.togglebtntext}>{summary ? 'Unlocked' : 'Locked'}</Text>
                    <PsIcon name={summary ? 'padlockUnlock' : 'padlock'} size={16} />
                  </Pressable>
                </View>
              </View>

              <View style={[styles.phasecard, {marginTop: 16}]}>
                <Text style={styles.infotitle}>⚙️ Reflection Questions Config</Text>
                <Text style={styles.infosubtitle}>
                  Customize the questions presented to students on their reflection slides.
                </Text>

                {qList.map((q, idx) => (
                  <View
                    key={idx}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingVertical: 6,
                      borderBottomWidth: 1,
                      borderBottomColor: '#f1f5f9',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'DMSans_500Medium',
                        fontSize: 14,
                        flex: 1,
                        color: c.navy,
                        paddingRight: 8,
                      }}
                    >
                      {idx + 1}. {q}
                    </Text>
                    <Pressable
                      onPress={() => removeQuestion(idx)}
                      style={{paddingHorizontal: 8, paddingVertical: 4}}
                    >
                      <Text style={{fontFamily: 'DMSans_700Bold', color: c.red, fontSize: 13}}>
                        Remove
                      </Text>
                    </Pressable>
                  </View>
                ))}

                <View style={{flexDirection: 'row', gap: 8, marginTop: 10}}>
                  <TextInput
                    style={{
                      flex: 1,
                      backgroundColor: c.offWhite,
                      borderWidth: 1,
                      borderColor: c.greyLight,
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      fontFamily: 'DMSans_400Regular',
                      fontSize: 13,
                    }}
                    value={newQText}
                    onChangeText={setNewQText}
                    placeholder="Type new reflection question..."
                    placeholderTextColor={c.greyLight}
                  />
                  <Pressable
                    onPress={addQuestion}
                    style={{
                      backgroundColor: c.navy,
                      borderRadius: 10,
                      paddingHorizontal: 16,
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{fontFamily: 'DMSans_700Bold', color: c.white, fontSize: 13}}>
                      + Add
                    </Text>
                  </Pressable>
                </View>
              </View>

              {ending ? (
                <ActivityIndicator color={c.red} size="large" style={{marginTop: 24}} />
              ) : (
                <Btn
                  label="End Current Session"
                  onPress={endSession}
                  color={c.red}
                  textColor={c.white}
                  style={{marginTop: 24}}
                  icon="forbidden"
                />
              )}
            </View>
          ) : (
            <View style={styles.formlayout}>
              <Text style={styles.formtitle}>Set Session Budget</Text>
              <Text style={styles.formsubtitle}>
                Students will use this budget to purchase items in the shopping phase.
              </Text>

              <TextInput
                style={styles.budgetinput}
                value={budgetInput}
                onChangeText={setBudgetInput}
                keyboardType="numeric"
                placeholder="50"
                placeholderTextColor={c.greyLight}
              />

              {starting ? (
                <ActivityIndicator color={c.orange} size="large" />
              ) : (
                <Btn
                  label="Start Session"
                  onPress={startSession}
                  color={c.orange}
                  textColor={c.white}
                  style={{width: '100%', marginTop: 24}}
                />
              )}
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
  },
  controlslayout: {
    gap: 12,
  },
  infotitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 22,
    color: c.navy,
  },
  infosubtitle: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: c.grey,
    marginBottom: 16,
  },
  phasecard: {
    backgroundColor: c.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 16,
  },
  phaserow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  phaseinfo: {
    flex: 1,
    paddingRight: 12,
  },
  phasename: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
    color: c.navy,
  },
  phasedesc: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: c.grey,
    marginTop: 2,
  },
  statustag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statustagtext: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 12,
    color: c.white,
  },
  togglebtn: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 110,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  togglebtntext: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 12,
    color: c.white,
  },
  formlayout: {
    backgroundColor: c.white,
    borderRadius: 20,
    padding: 32,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginTop: 40,
  },
  formtitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 22,
    color: c.navy,
    marginBottom: 8,
  },
  formsubtitle: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: c.grey,
    textAlign: 'center',
    marginBottom: 24,
  },
  budgetinput: {
    borderBottomWidth: 2,
    borderBottomColor: c.teal,
    fontSize: 36,
    fontFamily: 'DMSans_700Bold',
    color: c.navy,
    paddingVertical: 8,
    textAlign: 'center',
    width: '100%',
    maxWidth: 200,
    marginBottom: 16,
  },
});
