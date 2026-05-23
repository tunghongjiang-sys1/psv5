// app/student/groupings.tsx
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import { db, auth } from '../../lib/firebaseConfig';
import { useRouter } from 'expo-router';

type Student = {
  id: string;
  name: string;
};

const SESSION_ID = 'default-session';

export default function StudentGroupingsScreen() {
  const [loading, setLoading] = useState(true);
  const [groupMembers, setGroupMembers] = useState<Student[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [groupLocked, setGroupLocked] = useState(false);
  const [saving, setSaving] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const uid = auth.currentUser?.uid ?? null;
    if (!uid) {
      setLoading(false);
      return;
    }
    setCurrentUserId(uid);

    const studentRef = doc(db, 'students', uid);

    const unsubscribe = onSnapshot(
      studentRef,
      async (snap) => {
        if (!snap.exists()) {
          setLoading(false);
          return;
        }

        const data = snap.data();
        const memberIds = (data.groupMemberIds as string[]) || [];
        const locked = !!data.groupLocked;
        setGroupLocked(locked);

        if (memberIds.length === 0) {
          setGroupMembers([]);
          setLoading(false);
          return;
        }

        // Firestore "in" queries accept up to 10 ids; split if needed
        const chunks: string[][] = [];
        for (let i = 0; i < memberIds.length; i += 10) {
          chunks.push(memberIds.slice(i, i + 10));
        }

        const members: Student[] = [];

        for (const chunk of chunks) {
          const q = query(
            collection(db, 'students'),
            where('__name__', 'in', chunk),
            where('currentSessionId', '==', SESSION_ID)
          );
          const membersSnap = await getDocs(q);
          membersSnap.forEach((docSnap) => {
            const d = docSnap.data();
            members.push({
              id: docSnap.id,
              name: (d.name as string) || 'Unknown',
            });
          });
        }

        members.sort((a, b) => {
          if (a.id === uid) return -1;
          if (b.id === uid) return 1;
          return a.name.localeCompare(b.name);
        });

        setGroupMembers(members);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading current student', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const handleGo = async () => {
    if (!currentUserId) return;

    if (groupMembers.length === 0) {
      Alert.alert(
        'Group not ready',
        'Your teacher has not set your group yet. Please check with your teacher.'
      );
      return;
    }

    try {
      setSaving(true);
      if (!groupLocked) {
        await updateDoc(doc(db, 'students', currentUserId), {
          groupLocked: true,
        });
      }
      router.push('/student/interview');
    } catch (error) {
      console.error('Error locking group', error);
      Alert.alert('Error', 'Could not lock your group. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your group</Text>
      <Text style={styles.subtitle}>
        Your teacher has already arranged the groups. Check your group and tap Go to start.
      </Text>

      {groupLocked && (
        <Text style={styles.lockedText}>
          Your group is locked. You can now use the other tabs.
        </Text>
      )}

      {groupMembers.length === 0 ? (
        <Text style={styles.empty}>
          Your group is not set yet. Please tell your teacher.
        </Text>
      ) : (
        <FlatList
          data={groupMembers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => {
            const isCurrentUser = item.id === currentUserId;

            return (
              <View
                style={[
                  styles.cell,
                  isCurrentUser && styles.cellSelf,
                ]}
              >
                <Text style={styles.index}>{index + 1}.</Text>
                <Text
                  style={[
                    styles.name,
                    isCurrentUser && styles.nameSelf,
                  ]}
                >
                  {item.name}
                  {isCurrentUser ? ' (You)' : ''}
                </Text>
              </View>
            );
          }}
        />
      )}

      <Pressable
        onPress={handleGo}
        style={({ pressed }) => [
          styles.goButton,
          (pressed || saving) && { opacity: 0.85 },
          groupMembers.length === 0 && styles.goButtonDisabled,
        ]}
        disabled={saving || groupMembers.length === 0}
      >
        <Text style={styles.goText}>
          {saving ? 'Saving...' : groupLocked ? 'Continue' : 'Go'}
        </Text>
      </Pressable>
    </View>
  );
}

const PRIMARY_BLUE = '#002169';
const GREY = '#7F7F7F';
const SELF_BG = '#E0E0E0';

const styles = StyleSheet.create({
  loadingRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 24,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    marginBottom: 8,
  },
  lockedText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: PRIMARY_BLUE,
    marginBottom: 8,
  },
  empty: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    marginTop: 8,
  },
  list: {
    gap: 8,
    marginTop: 4,
    paddingBottom: 16,
  },
  cell: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#F2F2F2',
  },
  cellSelf: {
    backgroundColor: SELF_BG,
  },
  index: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 16,
    width: 24,
    color: GREY,
  },
  name: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 16,
    color: '#000',
  },
  nameSelf: {
    fontStyle: 'italic',
  },
  goButton: {
    marginTop: 12,
    alignSelf: 'flex-end',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: PRIMARY_BLUE,
  },
  goButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  goText: {
    fontFamily: 'DMSans_700Bold',
    color: '#ffffff',
    fontSize: 16,
  },
});