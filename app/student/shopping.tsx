
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, useWindowDimensions, SafeAreaView, Image, ImageSourcePropType } from 'react-native';
import { useRouter } from 'expo-router';
import { db, ref, update } from '../../lib/firebaseConfig';
import { usefb, itemsbuy, itemsbor, c } from '../../lib/helpers';
import { useStudentState } from '../../lib/students';
import { ProgressBar, PsIcon, Wide, Btn } from '../../components/parts';

const BUY_IMAGES: Record<string, ImageSourcePropType> = {
  colored_markers: require('../../assets/one_icon_one_png_named/01_coloured_markers_dollar3_per_packet.png'),
  painting_kit: require('../../assets/one_icon_one_png_named/02_painting_kit_dollar5_per_kit.png'),
  origami_paper: require('../../assets/one_icon_one_png_named/03_origami_paper_dollar3_per_packet.png'),
  terrarium_kit: require('../../assets/one_icon_one_png_named/04_terrarium_kit_dollar15_per_kit.png'),
  bento_box: require('../../assets/one_icon_one_png_named/05_bento_box_dollar5_per_packet.png'),
  gardening_kit: require('../../assets/one_icon_one_png_named/06_gardening_kit_dollar10_per_kit.png'),
  baking_equipment: require('../../assets/one_icon_one_png_named/07_baking_equipment_dollar10_per_kit.png'),
  traditional_games: require('../../assets/one_icon_one_png_named/08_traditional_games_set_dollar3_per_set.png'),
  dry_clay: require('../../assets/one_icon_one_png_named/09_dry_clay_dollar5_per_packet.png'),
  sugar: require('../../assets/one_icon_one_png_named/10_sugar_dollar2_per_packet.png'),
  oil: require('../../assets/one_icon_one_png_named/11_oil_dollar8_per_bottle.png'),
  packet_milk: require('../../assets/one_icon_one_png_named/12_packet_milk_dollar6_per_pack.png'),
  biscuits: require('../../assets/one_icon_one_png_named/13_biscuits_dollar4_per_packet.png'),
  single_packed_bread: require('../../assets/one_icon_one_png_named/14_single_packed_bread_dollar2_per_packet.png'),
  instant_noodles: require('../../assets/one_icon_one_png_named/15_instant_noodles_dollar2_per_packet.png'),
  tea: require('../../assets/one_icon_one_png_named/16_tea_dollar5_per_packet.png'),
  coffee_3_in_1: require('../../assets/one_icon_one_png_named/17_3_in_1_coffee_dollar5_per_packet.png'),
  canned_drinks: require('../../assets/one_icon_one_png_named/18_canned_drinks_dollar5_per_pack.png'),
  paper_cups: require('../../assets/one_icon_one_png_named/19_paper_cups_dollar5_per_packet.png'),
  bottled_soap: require('../../assets/one_icon_one_png_named/20_bottled_soap_dollar5_per_bottle.png'),
  percussion_triangle_a: require('../../assets/one_icon_one_png_named/33_percussion_triangle_dollar12_per_set_A.png'),
  sandals_a: require('../../assets/one_icon_one_png_named/34_sandals_dollar15_per_pair_A.png'),
  percussion_triangle_b: require('../../assets/one_icon_one_png_named/35_percussion_triangle_dollar12_per_set_B.png'),
  socks_a: require('../../assets/one_icon_one_png_named/36_socks_dollar2_per_pair_A.png'),
  socks_b: require('../../assets/one_icon_one_png_named/37_socks_dollar2_per_pair_B.png'),
  maracas_a: require('../../assets/one_icon_one_png_named/38_maracas_dollar3_per_set_A.png'),
  tambourine_a: require('../../assets/one_icon_one_png_named/39_tambourine_dollar10_per_set_A.png'),
  electric_fan_a: require('../../assets/one_icon_one_png_named/40_electric_fan_dollar38_per_piece_A.png'),
  sandals_b: require('../../assets/one_icon_one_png_named/41_sandals_dollar15_per_pair_B.png'),
  maracas_b: require('../../assets/one_icon_one_png_named/42_maracas_dollar3_per_set_B.png'),
  tambourine_b: require('../../assets/one_icon_one_png_named/43_tambourine_dollar10_per_set_B.png'),
  electric_fan_b: require('../../assets/one_icon_one_png_named/44_electric_fan_dollar38_per_piece_B.png'),
  foldable_umbrella: require('../../assets/one_icon_one_png_named/45_foldable_umbrella_dollar8_per_piece.png'),
  cereal: require('../../assets/one_icon_one_png_named/46_cereal_dollar4_per_box.png'),
  attraction_ticket: require('../../assets/one_icon_one_png_named/47_attraction_ticket_dollar20_per_ticket.png'),
  adult_diapers: require('../../assets/one_icon_one_png_named/48_adult_diapers_dollar10_per_packet.png'),
  skipping_rope: require('../../assets/one_icon_one_png_named/49_skipping_rope_dollar2_per_set.png'),
  frozen_vegetables: require('../../assets/one_icon_one_png_named/50_frozen_vegetables_dollar2_per_packet.png'),
  bottled_water: require('../../assets/one_icon_one_png_named/51_bottled_water_dollar1_per_bottle.png'),
  bus_transport_2_way: require('../../assets/one_icon_one_png_named/52_2_way_bus_transport_dollar130.png'),
  dustpan_and_broom: require('../../assets/one_icon_one_png_named/53_dustpan_and_broom_dollar5_per_set.png'),
  exercise_mat: require('../../assets/one_icon_one_png_named/54_exercise_mat_dollar10_per_piece.png'),
  catered_meal: require('../../assets/one_icon_one_png_named/55_catered_meal_dollar8_per_pax.png'),
  vouchers: require('../../assets/one_icon_one_png_named/56_vouchers_dollar10_per_piece.png'),
  soap_bar: require('../../assets/one_icon_one_png_named/57_soap_bar_dollar2_per_piece.png'),
  facial_cleanser: require('../../assets/one_icon_one_png_named/58_facial_cleanser_dollar6_per_bottle.png'),
};

const BORROW_IMAGES: Record<string, ImageSourcePropType> = {
  color_pencils: require('../../assets/one_icon_one_png_named/21_colour_pencils_available_10_packs.png'),
  crayons: require('../../assets/one_icon_one_png_named/22_crayons_available_10_packs.png'),
  av_system: require('../../assets/one_icon_one_png_named/23_av_system_available_1.png'),
  drawing_paper: require('../../assets/one_icon_one_png_named/24_drawing_paper_available_plenty.png'),
  foldable_table: require('../../assets/one_icon_one_png_named/25_foldable_table_available_20.png'),
  projector: require('../../assets/one_icon_one_png_named/26_projector_available_1.png'),
  construction_paper: require('../../assets/one_icon_one_png_named/27_construction_paper_available_plenty.png'),
  chairs: require('../../assets/one_icon_one_png_named/28_chairs_available_60.png'),
  mahjong_table: require('../../assets/one_icon_one_png_named/29_mahjong_table_available_2.png'),
  microphone: require('../../assets/one_icon_one_png_named/30_microphone_available_3.png'),
  scissors: require('../../assets/one_icon_one_png_named/31_scissors_available_20.png'),
  glue_stick: require('../../assets/one_icon_one_png_named/32_glue_stick_available_20.png'),
};

export default function StudentShoppingScreen() {
  const router = useRouter();
  const { studentId, sessionId } = useStudentState();
  const { width } = useWindowDimensions();

  useEffect(() => {
    if (!studentId || !sessionId) {
      router.replace('/student/name');
    }
  }, [studentId, sessionId]);

  const budget = usefb(sessionId ? `sessions/${sessionId}/budget` : null) ?? 50;
  const reflectionsUnlocked = usefb(sessionId ? `sessions/${sessionId}/unlocked/reflections` : null);

  const [bought, setBought] = useState<Record<string, number>>({});
  const [borrowed, setBorrowed] = useState<Record<string, number>>({});
  const initialised = useRef(false);

  const fbBought = usefb(sessionId && studentId ? `sessions/${sessionId}/students/${studentId}/bought` : null);
  const fbBorrowed = usefb(sessionId && studentId ? `sessions/${sessionId}/students/${studentId}/borrowed` : null);

  useEffect(() => {
    if (!initialised.current && fbBought !== undefined && fbBorrowed !== undefined) {
      setBought(fbBought || {});
      setBorrowed(fbBorrowed || {});
      initialised.current = true;
    }
  }, [fbBought, fbBorrowed]);

  useEffect(() => {
    if (initialised.current) {
      if (fbBought) setBought(fbBought);
      if (fbBorrowed) setBorrowed(fbBorrowed);
    }
  }, [fbBought, fbBorrowed]);

  const spent = itemsbuy.reduce((acc, item) => acc + (bought[item.id] || 0) * item.price, 0);
  const remaining = budget - spent;

  const [showNotEnoughMoney, setShowNotEnoughMoney] = useState(false);
  const notEnoughTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerNotEnoughMoney = useCallback(() => {
    setShowNotEnoughMoney(true);
    if (notEnoughTimerRef.current) {
      clearTimeout(notEnoughTimerRef.current);
    }
    notEnoughTimerRef.current = setTimeout(() => {
      setShowNotEnoughMoney(false);
      notEnoughTimerRef.current = null;
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (notEnoughTimerRef.current) {
        clearTimeout(notEnoughTimerRef.current);
      }
    };
  }, []);

  const updateBuy = useCallback(
    async (item: any, delta: number) => {
      const next = Math.max(0, (bought[item.id] || 0) + delta);
      if (delta > 0 && item.price > remaining) {
        triggerNotEnoughMoney();
        return;
      }
      setBought((prev: any) => ({ ...prev, [item.id]: next }));
      await update(ref(db, `sessions/${sessionId}/students/${studentId}/bought`), {
        [item.id]: next,
      });
    },
    [bought, remaining, sessionId, studentId, triggerNotEnoughMoney]
  );

  const updateBorrow = useCallback(
    async (item: any, delta: number) => {
      const current = borrowed[item.id] || 0;
      const next = Math.min(item.available, Math.max(0, current + delta));
      if (next === current) return;
      setBorrowed((prev: any) => ({ ...prev, [item.id]: next }));
      await update(ref(db, `sessions/${sessionId}/students/${studentId}/borrowed`), {
        [item.id]: next,
      });
    },
    [borrowed, sessionId, studentId]
  );

  const isTablet = width >= 768;
  const isDesktop = width >= 1100;
  const shopCardWidth = isDesktop ? '18%' : isTablet ? '22%' : '44%';

  const categories = ['Stationery & Craft', 'Food & Drinks', 'Household & Personal Care', 'Activities & Events'];

  return (
    <SafeAreaView style={styles.root}>
      <ProgressBar step="Plan Logistics" />

      {showNotEnoughMoney && (
        <View style={styles.notenoughbanner}>
          <PsIcon name="forbidden" size={18} />
          <Text style={styles.notenoughtext}>Not enough money</Text>
        </View>
      )}

      <View style={styles.budgetheader}>
        <PsIcon name="money" size={24} />
        <Text style={styles.budgetleft}>${remaining} left</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        <Wide>

          <View style={styles.sectionheadercontainer}>
            <Text style={styles.plainsectiontitle}>Active Aging Centre</Text>
            <Text style={styles.sectionsubtitle}>Borrow resources and equipment for free from the centre</Text>
          </View>

          <View style={styles.borrowgrid}>
            {itemsbor.map((item) => {
              const borrowedCount = borrowed[item.id] || 0;
              const isBorrowMaxed = borrowedCount >= item.available;

              return (
                <View
                  key={item.id}
                  style={[
                    styles.borrowcard,
                    {
                      width: shopCardWidth,
                    },
                  ]}
                >
                  <Image
                    source={BORROW_IMAGES[item.id] || require('../../assets/mascot.png')}
                    style={styles.itemimage}
                  />
                  <View style={styles.counterrow}>
                    <Pressable
                      onPress={() => updateBorrow(item, -1)}
                      style={styles.counterbutton}
                    >
                      <Text style={styles.counterbuttontext}>-</Text>
                    </Pressable>
                    <Text style={styles.countervalue}>{borrowedCount}</Text>
                    <Pressable
                      onPress={() => updateBorrow(item, 1)}
                      disabled={isBorrowMaxed}
                      style={[
                        styles.counterbutton,
                        { backgroundColor: c.tealLight },
                        isBorrowMaxed && styles.counterbuttondisabled,
                      ]}
                    >
                      <Text style={styles.counterbuttontext}>+</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>


          <View style={[styles.sectionheadercontainer, { marginTop: 24 }]}>
            <View style={styles.sectiontitlewithicon}>
              <PsIcon name="grocery" size={22} />
              <Text style={styles.sectiontitle}>Items to be Bought</Text>
            </View>
            <Text style={styles.sectionsubtitle}>Purchase additional items using your allocated budget</Text>
          </View>

          {categories.map((cat) => {
            const catItems = itemsbuy.filter((i: any) => i.category === cat);
            if (catItems.length === 0) return null;

            return (
              <View key={cat} style={styles.categoryblock}>
                <Text style={styles.categorytitle}>{cat}</Text>
                <View style={styles.buygrid}>
                  {catItems.map((item) => (
                    <View key={item.id} style={[styles.buycard, { width: shopCardWidth }]}>
                      <Image
                        source={BUY_IMAGES[item.id as keyof typeof BUY_IMAGES] || require('../../assets/mascot.png')}
                        style={styles.itemimage}
                      />
                      <View style={styles.counterrow}>
                        <Pressable
                          onPress={() => updateBuy(item, -1)}
                          style={styles.counterbutton}
                        >
                          <Text style={styles.counterbuttontext}>-</Text>
                        </Pressable>
                        <Text style={styles.countervalue}>{bought[item.id] || 0}</Text>
                        <Pressable
                          onPress={() => updateBuy(item, 1)}
                          style={[styles.counterbutton, { backgroundColor: c.teal }]}
                        >
                          <Text style={styles.counterbuttontext}>+</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}

          {reflectionsUnlocked === true ? (
            <Btn
              label="Continue to Reflections →"
              onPress={() => router.push('/student/reflections')}
              color={c.purple}
              textColor={c.white}
              style={{ marginTop: 24 }}
            />
          ) : (
            <View style={styles.lockbox}>
              <Text style={styles.locktext}>
                Reflections unlocks when teacher is ready
              </Text>
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
  budgetheader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    paddingRight: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  notenoughbanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FDECEA',
    borderBottomWidth: 1,
    borderBottomColor: '#F5C6C0',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  notenoughtext: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
    color: '#B23A2F',
  },
  budgetleft: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 22,
    color: c.navy,
  },
  sectionheadercontainer: {
    marginBottom: 14,
  },
  sectionsubtitle: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: c.grey,
    marginTop: 2,
  },
  categoryblock: {
    marginBottom: 18,
    backgroundColor: '#FAFAFD',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEF0F6',
  },
  categorytitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
    color: c.purpleMid,
    marginBottom: 10,
  },
  sectiontitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 20,
    color: c.navy,
  },
  plainsectiontitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 20,
    color: c.navy,
  },
  sectiontitlewithicon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buygrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  buycard: {
    minWidth: 130,
    borderWidth: 1,
    borderColor: c.greyLight,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    backgroundColor: c.white,
  },
  itemimage: {
    width: '100%',
    height: 116,
    resizeMode: 'contain',
  },
  counterrow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
  },
  counterbutton: {
    backgroundColor: c.greyLight,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterbuttondisabled: {
    opacity: 0.35,
  },
  counterbuttontext: {
    fontSize: 20,
    color: c.navy,
    lineHeight: 24,
    textAlign: 'center',
  },
  countervalue: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    color: c.navy,
    minWidth: 24,
    textAlign: 'center',
  },
  borrowgrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  borrowcard: {
    borderWidth: 1,
    borderColor: '#C5DFC5',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#F0FAF0',
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
