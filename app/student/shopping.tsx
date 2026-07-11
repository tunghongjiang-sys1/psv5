
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, useWindowDimensions, SafeAreaView, Image, ImageSourcePropType } from 'react-native';
import { useRouter } from 'expo-router';
import { db, ref, update } from '../../lib/firebaseConfig';
import { usefb, itemsbuy, itemsbor, c } from '../../lib/helpers';
import { useStudentState } from '../../lib/students';
import { ProgressBar, PsIcon, Wide, Btn } from '../../components/parts';
import { BUY_IMAGES, BORROW_IMAGES } from '../../lib/shoppingitems';

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
      <ProgressBar step="Logistics" />

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
