import { useState, useEffect } from 'react';
import { onValue, ref } from 'firebase/database';
import { Alert, Platform } from 'react-native';
import { db } from './firebaseConfig';

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
    const unsub = onValue(
      ref(db, path),
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

export const itemsbuy = [
  { id: 'colored_markers', name: 'Coloured Markers', price: 3, unit: 'per packet', emoji: '🖍️' },
  { id: 'painting_kit', name: 'Painting Kit', price: 5, unit: 'per kit', emoji: '🎨' },
  { id: 'origami_paper', name: 'Origami Paper', price: 3, unit: 'per packet' },
  { id: 'terrarium_kit', name: 'Terrarium Kit', price: 15, unit: 'per kit', emoji: '🌿' },
  { id: 'bento_box', name: 'Bento Box', price: 5, unit: 'per packet', emoji: '🍱' },
  { id: 'gardening_kit', name: 'Gardening Kit', price: 10, unit: 'per kit', emoji: '🌱' },
  { id: 'baking_equipment', name: 'Baking Equipment', price: 10, unit: 'per kit', emoji: '🧁' },
  { id: 'traditional_games', name: 'Traditional Games Set', price: 3, unit: 'per set', emoji: '🎲' },
  { id: 'dry_clay', name: 'Dry Clay', price: 5, unit: 'per packet' },
  { id: 'sugar', name: 'Sugar', price: 2, unit: 'per packet' },
  { id: 'oil', name: 'Oil', price: 8, unit: 'per bottle' },
  { id: 'packet_milk', name: 'Packet Milk', price: 6, unit: 'per pack' },
  { id: 'biscuits', name: 'Biscuits', price: 4, unit: 'per packet' },
  { id: 'single_packed_bread', name: 'Single Packed Bread', price: 2, unit: 'per packet' },
  { id: 'instant_noodles', name: 'Instant Noodles', price: 2, unit: 'per packet' },
  { id: 'tea', name: 'Tea', price: 5, unit: 'per packet' },
  { id: 'coffee_3_in_1', name: '3 in 1 Coffee', price: 5, unit: 'per packet' },
  { id: 'canned_drinks', name: 'Canned Drinks', price: 5, unit: 'per pack' },
  { id: 'paper_cups', name: 'Paper Cups', price: 5, unit: 'per packet' },
  { id: 'bottled_soap', name: 'Bottled Soap', price: 5, unit: 'per bottle' },
  { id: 'percussion_triangle_a', name: 'Percussion Triangle A', price: 12, unit: 'per set' },
  { id: 'sandals_a', name: 'Sandals A', price: 15, unit: 'per pair' },
  { id: 'percussion_triangle_b', name: 'Percussion Triangle B', price: 12, unit: 'per set' },
  { id: 'socks_a', name: 'Socks A', price: 2, unit: 'per pair' },
  { id: 'socks_b', name: 'Socks B', price: 2, unit: 'per pair' },
  { id: 'maracas_a', name: 'Maracas A', price: 3, unit: 'per set' },
  { id: 'tambourine_a', name: 'Tambourine A', price: 10, unit: 'per set' },
  { id: 'electric_fan_a', name: 'Electric Fan A', price: 38, unit: 'per piece' },
  { id: 'sandals_b', name: 'Sandals B', price: 15, unit: 'per pair' },
  { id: 'maracas_b', name: 'Maracas B', price: 3, unit: 'per set' },
  { id: 'tambourine_b', name: 'Tambourine B', price: 10, unit: 'per set' },
  { id: 'electric_fan_b', name: 'Electric Fan B', price: 38, unit: 'per piece' },
  { id: 'foldable_umbrella', name: 'Foldable Umbrella', price: 8, unit: 'per piece' },
  { id: 'cereal', name: 'Cereal', price: 4, unit: 'per box' },
  { id: 'attraction_ticket', name: 'Attraction Ticket', price: 20, unit: 'per ticket' },
  { id: 'adult_diapers', name: 'Adult Diapers', price: 10, unit: 'per packet' },
  { id: 'skipping_rope', name: 'Skipping Rope', price: 2, unit: 'per set' },
  { id: 'frozen_vegetables', name: 'Frozen Vegetables', price: 2, unit: 'per packet' },
  { id: 'bottled_water', name: 'Bottled Water', price: 1, unit: 'per bottle' },
  { id: 'bus_transport_2_way', name: '2 Way Bus Transport', price: 130, unit: '' },
  { id: 'dustpan_and_broom', name: 'Dustpan and Broom', price: 5, unit: 'per set' },
  { id: 'exercise_mat', name: 'Exercise Mat', price: 10, unit: 'per piece' },
  { id: 'catered_meal', name: 'Catered Meal', price: 8, unit: 'per pax' },
  { id: 'vouchers', name: 'Vouchers', price: 10, unit: 'per piece' },
  { id: 'soap_bar', name: 'Soap Bar', price: 2, unit: 'per piece' },
  { id: 'facial_cleanser', name: 'Facial Cleanser', price: 6, unit: 'per bottle' },
];

export const itemsbor = [
  { id: 'color_pencils', name: 'Colour Pencils', available: 10, emoji: '✏️' },
  { id: 'crayons', name: 'Crayons', available: 10, emoji: '🖊️' },
  { id: 'av_system', name: 'AV System', available: 1, emoji: '📻' },
  { id: 'drawing_paper', name: 'Drawing Paper', available: 999, emoji: '📄' },
  { id: 'foldable_table', name: 'Foldable Table', available: 20, emoji: '🪑' },
  { id: 'projector', name: 'Projector', available: 1, emoji: '📽️' },
  { id: 'construction_paper', name: 'Construction Paper', available: 999, emoji: '📋' },
  { id: 'chairs', name: 'Chairs', available: 60 },
  { id: 'mahjong_table', name: 'Mahjong Table', available: 2 },
  { id: 'microphone', name: 'Microphone', available: 3 },
  { id: 'scissors', name: 'Scissors', available: 20 },
  { id: 'glue_stick', name: 'Glue Stick', available: 20 },
];

export const teachpass = '6767';
