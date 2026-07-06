import { useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { db, onValue, ref } from './firebaseConfig';

export { interviewPersonas as defpers } from '../components/interviewChatConfig';

export const showAlert = (title: string, message?: string) => {
  if (Platform.OS === 'web') {
    alert(title + (message ? '\n' : '') + (message || ''));
  } else {
    Alert.alert(title, message);
  }
};

export const showConfirm = (
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void
) => {
  if (Platform.OS === 'web') {
    const yes = window.confirm(`${title}\n\n${message}`);
    if (yes) {
      onConfirm();
    } else if (onCancel) {
      onCancel();
    }
  } else {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: onCancel },
      { text: 'End Session', style: 'destructive', onPress: onConfirm },
    ]);
  }
};

const TO = 8000;

export const fw = <T>(p: Promise<T>): Promise<T> =>
  Promise.race([
    p,
    new Promise<never>((_, rej) =>
      setTimeout(
        () => rej(new Error('Timed out. Check your Firebase Realtime Database URL & rules.')),
        TO
      )
    ),
  ]);

export function usefb(path: string | null) {
  const [val, setVal] = useState<any>(undefined);

  useEffect(() => {
    if (!path) {
      setVal(null);
      return;
    }
    setVal(undefined);
    const dbRef = ref(db, path);
    const unsub = onValue(
      dbRef,
      (snap) => {
        setVal(snap.val() ?? null);
      },
      () => {
        setVal(null);
      }
    );
    return () => unsub();
  }, [path]);

  return val;
}

export const c = {
  teal: '#4ECDC4',
  tealLight: '#7EDDD7',
  navy: '#1A1F5E',
  navyLight: '#2D3480',
  yellow: '#FFD60A',
  orange: '#FF5733',
  pink: '#FF4785',
  purple: '#7B68C8',
  purpleLight: '#9B8FD8',
  purpleMid: '#5A4A9E',
  grey: '#888B94',
  greyLight: '#C5C8D0',
  greyDark: '#5A5D66',
  white: '#FFFFFF',
  offWhite: '#F8F9FA',
  black: '#111111',
  green: '#27AE60',
  red: '#E74C3C',
};

export const defaultReflectionQuestions = [
  'What did you learn about planning with seniors in mind?',
  'Which idea from your group could make the biggest impact, and why?',
  'What would you improve if you had more time?',
];

export const normalizeReflectionQuestions = (value: any): string[] => {
  const raw = Array.isArray(value)
    ? value
    : value && typeof value === 'object'
      ? Object.keys(value)
          .sort((a, b) => Number(a) - Number(b))
          .map((key) => value[key])
      : defaultReflectionQuestions;

  const cleaned = raw
    .map((question: any) => String(question ?? '').trim())
    .filter((question: string) => question.length > 0);

  return cleaned.length > 0 ? cleaned : defaultReflectionQuestions;
};

export const getReflectionAnswer = (student: any, index: number): string => {
  const reflections = student?.reflections;
  if (Array.isArray(reflections)) {
    return String(reflections[index] ?? '');
  }
  if (reflections && typeof reflections === 'object') {
    return String(reflections[index] ?? reflections[String(index)] ?? '');
  }
  return index === 0 ? String(student?.reflection ?? '') : '';
};

export const getReflectionAnswers = (student: any, questions: string[]) =>
  questions.map((question, index) => ({
    question,
    answer: getReflectionAnswer(student, index).trim(),
  }));

export type WhiteboardStroke = {
  color: string;
  points: { x: number; y: number }[];
  erase?: boolean;
};

export const parseWhiteboardStrokes = (raw: any): WhiteboardStroke[] => {
  if (!raw) return [];
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const formatReflectionSummary = (student: any, questions: string[]) =>
  getReflectionAnswers(student, questions)
    .map(({ question, answer }, index) =>
      `${index + 1}. ${question}: ${answer || 'No answer yet'}`
    )
    .join(' | ');

export const itemsbuy = [

  { id: 'colored_markers', name: 'Coloured Markers', price: 3, unit: 'per packet', category: 'Stationery & Craft' },
  { id: 'painting_kit', name: 'Painting Kit', price: 5, unit: 'per kit', category: 'Stationery & Craft' },
  { id: 'origami_paper', name: 'Origami Paper', price: 3, unit: 'per packet', category: 'Stationery & Craft' },
  { id: 'terrarium_kit', name: 'Terrarium Kit', price: 15, unit: 'per kit', category: 'Stationery & Craft' },
  { id: 'gardening_kit', name: 'Gardening Kit', price: 10, unit: 'per kit', category: 'Stationery & Craft' },
  { id: 'baking_equipment', name: 'Baking Equipment', price: 10, unit: 'per kit', category: 'Stationery & Craft' },
  { id: 'traditional_games', name: 'Traditional Games Set', price: 3, unit: 'per set', category: 'Stationery & Craft' },
  { id: 'dry_clay', name: 'Dry Clay', price: 5, unit: 'per packet', category: 'Stationery & Craft' },

  { id: 'bento_box', name: 'Bento Box', price: 5, unit: 'per packet', category: 'Food & Drinks' },
  { id: 'sugar', name: 'Sugar', price: 2, unit: 'per packet', category: 'Food & Drinks' },
  { id: 'oil', name: 'Oil', price: 8, unit: 'per bottle', category: 'Food & Drinks' },
  { id: 'packet_milk', name: 'Packet Milk', price: 6, unit: 'per pack', category: 'Food & Drinks' },
  { id: 'biscuits', name: 'Biscuits', price: 4, unit: 'per packet', category: 'Food & Drinks' },
  { id: 'single_packed_bread', name: 'Single Packed Bread', price: 2, unit: 'per packet', category: 'Food & Drinks' },
  { id: 'instant_noodles', name: 'Instant Noodles', price: 2, unit: 'per packet', category: 'Food & Drinks' },
  { id: 'tea', name: 'Tea', price: 5, unit: 'per packet', category: 'Food & Drinks' },
  { id: 'coffee_3_in_1', name: '3 in 1 Coffee', price: 5, unit: 'per packet', category: 'Food & Drinks' },
  { id: 'canned_drinks', name: 'Canned Drinks', price: 5, unit: 'per pack', category: 'Food & Drinks' },
  { id: 'paper_cups', name: 'Paper Cups', price: 5, unit: 'per packet', category: 'Food & Drinks' },
  { id: 'cereal', name: 'Cereal', price: 4, unit: 'per box', category: 'Food & Drinks' },
  { id: 'frozen_vegetables', name: 'Frozen Vegetables', price: 2, unit: 'per packet', category: 'Food & Drinks' },
  { id: 'bottled_water', name: 'Bottled Water', price: 1, unit: 'per bottle', category: 'Food & Drinks' },
  { id: 'catered_meal', name: 'Catered Meal', price: 8, unit: 'per pax', category: 'Food & Drinks' },

  { id: 'bottled_soap', name: 'Bottled Soap', price: 5, unit: 'per bottle', category: 'Household & Personal Care' },
  { id: 'sandals_a', name: 'Sandals A', price: 15, unit: 'per pair', category: 'Household & Personal Care' },
  { id: 'socks_a', name: 'Socks A', price: 2, unit: 'per pair', category: 'Household & Personal Care' },
  { id: 'electric_fan_a', name: 'Electric Fan A', price: 38, unit: 'per piece', category: 'Household & Personal Care' },
  { id: 'foldable_umbrella', name: 'Foldable Umbrella', price: 8, unit: 'per piece', category: 'Household & Personal Care' },
  { id: 'adult_diapers', name: 'Adult Diapers', price: 10, unit: 'per packet', category: 'Household & Personal Care' },
  { id: 'dustpan_and_broom', name: 'Dustpan and Broom', price: 5, unit: 'per set', category: 'Household & Personal Care' },
  { id: 'soap_bar', name: 'Soap Bar', price: 2, unit: 'per piece', category: 'Household & Personal Care' },
  { id: 'facial_cleanser', name: 'Facial Cleanser', price: 6, unit: 'per bottle', category: 'Household & Personal Care' },

  { id: 'percussion_triangle_a', name: 'Percussion Triangle A', price: 12, unit: 'per set', category: 'Activities & Events' },
  { id: 'maracas_a', name: 'Maracas A', price: 3, unit: 'per set', category: 'Activities & Events' },
  { id: 'tambourine_a', name: 'Tambourine A', price: 10, unit: 'per set', category: 'Activities & Events' },
  { id: 'attraction_ticket', name: 'Attraction Ticket', price: 20, unit: 'per ticket', category: 'Activities & Events' },
  { id: 'skipping_rope', name: 'Skipping Rope', price: 2, unit: 'per set', category: 'Activities & Events' },
  { id: 'bus_transport_2_way', name: '2 Way Bus Transport', price: 130, unit: '', category: 'Activities & Events' },
  { id: 'exercise_mat', name: 'Exercise Mat', price: 10, unit: 'per piece', category: 'Activities & Events' },
  { id: 'vouchers', name: 'Vouchers', price: 10, unit: 'per piece', category: 'Activities & Events' },
];

export const itemsbor = [
  { id: 'color_pencils', name: 'Colour Pencils', available: 10 },
  { id: 'crayons', name: 'Crayons', available: 10 },
  { id: 'av_system', name: 'AV System', available: 1 },
  { id: 'drawing_paper', name: 'Drawing Paper', available: 999 },
  { id: 'foldable_table', name: 'Foldable Table', available: 20 },
  { id: 'projector', name: 'Projector', available: 1 },
  { id: 'construction_paper', name: 'Construction Paper', available: 999 },
  { id: 'chairs', name: 'Chairs', available: 60 },
  { id: 'mahjong_table', name: 'Mahjong Table', available: 2 },
  { id: 'microphone', name: 'Microphone', available: 3 },
  { id: 'scissors', name: 'Scissors', available: 20 },
  { id: 'glue_stick', name: 'Glue Stick', available: 20 },
];

export const teachpass = '6767';
