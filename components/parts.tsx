// components/Shared.tsx
import React, { memo } from 'react';
import { View, Text, Image, ImageSourcePropType, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { c } from '../lib/helpers';

export type PsIconName =
  | 'checklist'
  | 'complete'
  | 'forbidden'
  | 'grocery'
  | 'money'
  | 'padlock'
  | 'padlockUnlock'
  | 'settings';

const PS_ICONS: Record<PsIconName, ImageSourcePropType> = {
  checklist: require('../assets/icons for ps/checklist.png'),
  complete: require('../assets/icons for ps/complete.png'),
  forbidden: require('../assets/icons for ps/forbidden.png'),
  grocery: require('../assets/icons for ps/grocery-store.png'),
  money: require('../assets/icons for ps/money.png'),
  padlock: require('../assets/icons for ps/padlock.png'),
  padlockUnlock: require('../assets/icons for ps/padlock-unlock.png'),
  settings: require('../assets/icons for ps/settings.png'),
};

export const PsIcon = memo(
  ({ name, size = 18, style }: { name: PsIconName; size?: number; style?: any }) => (
    <Image
      source={PS_ICONS[name]}
      style={[{ width: size, height: size, resizeMode: 'contain' }, style]}
    />
  )
);

export const Mascot = memo(({ size = 60 }: { size?: number }) => (
  <Image
    source={require('../assets/mascot.png')}
    style={{ width: size, height: size * 1.25 }}
    resizeMode="contain"
  />
));

export const Wide = ({ children, style }: { children?: React.ReactNode; style?: any }) => {
  const { width } = useWindowDimensions();
  return (
    <View
      style={[
        { width: '100%' },
        width >= 900 && { maxWidth: 860, alignSelf: 'center' },
        style,
      ]}
    >
      {children}
    </View>
  );
};

export const ProgressBar = memo(({ step }: { step: string }) => {
  const steps = ['Groupings', 'Interview', 'Shopping', 'Reflections', 'Summary'];
  const idx = steps.indexOf(step);
  return (
    <View style={styles.progBarRoot}>
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          {i > 0 && (
            <View
              style={[
                styles.progLine,
                { backgroundColor: i <= idx ? c.navy : c.greyLight },
              ]}
            />
          )}
          <View style={{ alignItems: 'center' }}>
            {i === idx ? (
              <View style={{ alignItems: 'center' }}>
                <View style={styles.progActiveBadge}>
                  <Text style={styles.progActiveText}>{s}</Text>
                </View>
                <Mascot size={28} />
              </View>
            ) : (
              <View
                style={[
                  styles.progDot,
                  { backgroundColor: i < idx ? c.orange : c.greyLight },
                ]}
              />
            )}
          </View>
        </React.Fragment>
      ))}
    </View>
  );
});

interface BtnProps {
  label: string;
  onPress: () => void;
  color?: string;
  textColor?: string;
  style?: any;
  disabled?: boolean;
  icon?: PsIconName;
}

export const Btn = memo(({ label, onPress, color = c.yellow, textColor = c.navy, style, disabled, icon }: BtnProps) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    style={({ pressed }) => [
      styles.btn,
      { backgroundColor: disabled ? c.greyLight : color },
      pressed && !disabled && { opacity: 0.85 },
      style,
    ]}
  >
    <View style={styles.btnContent}>
      {icon && <PsIcon name={icon} size={20} />}
      <Text
        style={[
          styles.btnText,
          { color: disabled ? c.grey : textColor },
        ]}
      >
        {label}
      </Text>
    </View>
  </Pressable>
));

const styles = StyleSheet.create({
  progBarRoot: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: c.white,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    width: '100%',
  },
  progLine: {
    flex: 1,
    height: 3,
  },
  progActiveBadge: {
    backgroundColor: c.navy,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginBottom: 2,
  },
  progActiveText: {
    color: c.white,
    fontSize: 8,
    fontFamily: 'DMSans_700Bold',
  },
  progDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  btn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 17,
  },
});
