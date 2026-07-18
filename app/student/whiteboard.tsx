import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {useRouter} from 'expo-router';
import {db, ref, update} from '../../lib/firebaseConfig';
import {usefb, fw, c} from '../../lib/helpers';
import {useStudentState} from '../../lib/students';
import {Wide, Btn} from '../../components/parts';

type Stroke = {
  color: string;
  points: {x: number; y: number}[];
};

export default function StudentWhiteboardScreen() {
  const router = useRouter();
  const {studentId, sessionId} = useStudentState();
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState(c.navy);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [saving, setSaving] = useState(false);
  const [initialised, setInitialised] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);

  useEffect(() => {
    if (!studentId || !sessionId) {
      router.replace('/student/name');
    }
  }, [studentId, sessionId]);

  const student = usefb(
    sessionId && studentId ? `sessions/${sessionId}/students/${studentId}` : null,
  );
  const summaryUnlocked = usefb(sessionId ? `sessions/${sessionId}/unlocked/summary` : null);

  useEffect(() => {
    if (student && !initialised) {
      setInitialised(true);
      if (student.whiteboardNotes) setNotes(student.whiteboardNotes);
      if (student.whiteboardStrokes) {
        try {
          const parsed =
            typeof student.whiteboardStrokes === 'string'
              ? JSON.parse(student.whiteboardStrokes)
              : student.whiteboardStrokes;
          setStrokes(parsed || []);
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [student, initialised]);

  useEffect(() => {
    if (Platform.OS === 'web' && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 3;

      const allStrokes = [...strokes, ...(currentStroke ? [currentStroke] : [])];
      allStrokes.forEach((stroke) => {
        if (stroke.points.length < 2) return;
        ctx.strokeStyle = stroke.color;
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
      });
    }
  }, [strokes, currentStroke]);

  const saveWhiteboard = async () => {
    setSaving(true);
    try {
      await fw(
        update(ref(db, `sessions/${sessionId}/students/${studentId}`), {
          whiteboardNotes: notes,
          whiteboardStrokes: JSON.stringify(strokes),
        }),
      );
      Alert.alert('Whiteboard Saved!', 'Your ideas have been recorded.');
    } catch (e: any) {
      Alert.alert('Error saving', e.message);
    } finally {
      setSaving(false);
    }
  };

  const clearCanvas = () => {
    setStrokes([]);
    setCurrentStroke(null);
  };

  const handleMouseDown = (e: any) => {
    if (Platform.OS !== 'web' || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0] && e.touches[0].clientX);
    const clientY = e.clientY ?? (e.touches && e.touches[0] && e.touches[0].clientY);
    if (clientX === undefined || clientY === undefined) return;

    if (e.cancelable) e.preventDefault();

    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    isDrawing.current = true;
    setCurrentStroke({color, points: [{x, y}]});
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing.current || Platform.OS !== 'web' || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0] && e.touches[0].clientX);
    const clientY = e.clientY ?? (e.touches && e.touches[0] && e.touches[0].clientY);
    if (clientX === undefined || clientY === undefined) return;

    if (e.cancelable) e.preventDefault();

    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    setCurrentStroke((prev) => {
      if (!prev) return null;
      const newPoints = [...prev.points, {x, y}];
      return {...prev, points: newPoints};
    });
  };

  const handleMouseUp = () => {
    if (isDrawing.current && currentStroke) {
      isDrawing.current = false;
      setStrokes((prev) => [...prev, currentStroke]);
      setCurrentStroke(null);
    }
  };

  const downloadWork = () => {
    if (Platform.OS !== 'web') {
      Alert.alert('Download only available on Web browser views.');
      return;
    }
    let downloadedAny = false;
    if (canvasRef.current && strokes.length > 0) {
      const link = document.createElement('a');
      link.download = 'whiteboard-drawing.png';
      link.href = canvasRef.current.toDataURL('image/png');
      link.click();
      downloadedAny = true;
    }
    if (notes.trim()) {
      const element = document.createElement('a');
      const file = new Blob([notes], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = 'whiteboard-notes.txt';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      downloadedAny = true;
    }
    if (!downloadedAny) {
      Alert.alert('Nothing to download', 'Please draw something or type some notes first!');
    }
  };

  const colors = [c.navy, c.teal, c.orange, c.purple, c.red, c.black];

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView style={{flex: 1}} contentContainerStyle={{padding: 20}}>
        <Wide>
          <View style={styles.header}>
            <Text style={styles.title}>Student Whiteboard</Text>
            <Text style={styles.subtitle}>
              Express your team's ideas, notes, or sketch down your solution!
            </Text>
          </View>

          <View style={styles.toolbar}>
            <Text style={styles.toollabel}>Color:</Text>
            {colors.map((clr) => (
              <Pressable
                key={clr}
                onPress={() => setColor(clr)}
                style={[
                  styles.colorbox,
                  {backgroundColor: clr},
                  color === clr && styles.activecolor,
                ]}
              />
            ))}
            <Pressable onPress={clearCanvas} style={styles.clearbtn}>
              <Text style={styles.cleartext}>Clear Drawing</Text>
            </Pressable>
            {saving ? (
              <ActivityIndicator color={c.navy} style={{marginLeft: 'auto'}} />
            ) : (
              <Pressable onPress={saveWhiteboard} style={styles.savebtn}>
                <Text style={styles.savetext}>Save Work</Text>
              </Pressable>
            )}
            <Pressable onPress={downloadWork} style={styles.downloadbtn}>
              <Text style={styles.downloadtext}>Download Work</Text>
            </Pressable>
          </View>

          <View style={styles.canvascard}>
            {Platform.OS === 'web' ? (
              <canvas
                ref={canvasRef as any}
                width={700}
                height={320}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onTouchStart={handleMouseDown}
                onTouchMove={handleMouseMove}
                onTouchEnd={handleMouseUp}
                style={{
                  width: '100%',
                  height: 320,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  cursor: 'crosshair',
                  touchAction: 'none',
                }}
              />
            ) : (
              <View style={styles.mobilefallback}>
                <Text style={styles.fallbacktext}>
                  Interactive Canvas active on Web browser view.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.notescard}>
            <Text style={styles.notestitle}>Written Key Ideas & Project Notes:</Text>
            <TextInput
              style={styles.notesinput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Jot down key points, group reflections, or logistics notes here..."
              placeholderTextColor={c.greyLight}
              multiline
            />
          </View>

          {summaryUnlocked === true ? (
            <Btn
              label="Continue to Summary →"
              onPress={() => router.push('/student/submit')}
              color={c.purple}
              textColor={c.white}
              style={{marginTop: 24}}
            />
          ) : (
            <View style={styles.lockbox}>
              <Text style={styles.locktext}>Summary unlocks when teacher is ready</Text>
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
    backgroundColor: c.white,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 24,
    color: c.navy,
  },
  subtitle: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: c.grey,
    marginTop: 4,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F0F4F8',
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  toollabel: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
    color: c.navy,
  },
  colorbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activecolor: {
    borderColor: c.yellow,
    transform: [{scale: 1.15}],
  },
  clearbtn: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  cleartext: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 12,
    color: c.greyDark,
  },
  savebtn: {
    backgroundColor: c.teal,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginLeft: 'auto',
  },
  savetext: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
    color: c.white,
  },
  downloadbtn: {
    backgroundColor: c.purple,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginLeft: 8,
  },
  downloadtext: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
    color: c.white,
  },
  canvascard: {
    borderWidth: 2,
    borderColor: c.navy,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: c.white,
  },
  mobilefallback: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  fallbacktext: {
    fontFamily: 'DMSans_500Medium',
    color: c.grey,
    textAlign: 'center',
  },
  notescard: {
    backgroundColor: '#F9F9FC',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E4EC',
  },
  notestitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    color: c.navy,
    marginBottom: 10,
  },
  notesinput: {
    backgroundColor: c.white,
    borderRadius: 12,
    padding: 14,
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: c.navy,
    minHeight: 90,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: c.greyLight,
  },
  lockbox: {
    alignItems: 'center',
    padding: 16,
    marginTop: 16,
  },
  locktext: {
    fontFamily: 'DMSans_500Medium',
    color: c.grey,
    fontSize: 13,
  },
});
