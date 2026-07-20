import React, {memo} from 'react';
import {
  View,
  Text,
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import {c} from '../lib/helpers';

export type PsIconName =
  | 'checklist'
  | 'complete'
  | 'forbidden'
  | 'grocery'
  | 'money'
  | 'padlock'
  | 'padlockUnlock'
  | 'settings';

const psIcons: Record<PsIconName, ImageSourcePropType> = {
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
  ({name, size = 18, style}: {name: PsIconName; size?: number; style?: any}) => (
    <Image
      source={psIcons[name]}
      style={[{width: size, height: size, resizeMode: 'contain'}, style]}
    />
  ),
);

export const Mascot = memo(({size = 60}: {size?: number}) => (
  <Image
    source={require('../assets/mascot.png')}
    style={{width: size, height: size * 1.25}}
    resizeMode="contain"
  />
));

export const Wide = ({children, style}: {children?: React.ReactNode; style?: any}) => {
  const {width} = useWindowDimensions();
  return (
    <View style={[{width: '100%'}, width >= 900 && {maxWidth: 860, alignSelf: 'center'}, style]}>
      {children}
    </View>
  );
};

export const progressSteps = [
  'Groupings',
  'Interview',
  'Plan Logistics',
  'Reflections',
  'Whiteboard',
  'Summary',
] as const;

export type ProgressBarProps = {
  step?: string;

  activeIndex?: number;

  unlocked?: boolean[];

  completed?: boolean[];
};

export const ProgressBar = memo((props: ProgressBarProps) => {
  const activeIndex =
    typeof props.activeIndex === 'number'
      ? props.activeIndex
      : progressSteps.indexOf((props.step || 'Groupings') as any);
  const totalSteps = progressSteps.length;
  const unlocked =
    props.unlocked && props.unlocked.length === totalSteps
      ? props.unlocked
      : new Array(totalSteps).fill(false);
  const completed =
    props.completed && props.completed.length === totalSteps
      ? props.completed
      : new Array(totalSteps).fill(false);

  const lineColor = (leftIdx: number) =>
    completed[leftIdx]
      ? c.teal
      : leftIdx + 1 <= activeIndex
        ? c.navy
        : c.greyLight;

  return (
    <View style={styles.progBarRoot}>
      {progressSteps.map((s, i) => (
        <React.Fragment key={s}>
          {i > 0 && <View style={[styles.progLine, {backgroundColor: lineColor(i - 1)}]} />}
          <View style={{alignItems: 'center'}}>
            {i === activeIndex ? (
              <View style={{alignItems: 'center'}}>
                <View style={styles.progActiveBadge}>
                  <Text style={styles.progActiveText}>{s}</Text>
                </View>
                <Mascot size={28} />
              </View>
            ) : (
              <View
                style={[
                  styles.progDot,
                  {
                    backgroundColor: completed[i]
                      ? c.teal
                      : unlocked[i]
                        ? c.orange
                        : i < activeIndex
                          ? c.greyLight
                          : c.greyLight,
                    opacity: completed[i] || unlocked[i] ? 1 : 0.55,
                  },
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

export const Btn = memo(
  ({label, onPress, color = c.yellow, textColor = c.navy, style, disabled, icon}: BtnProps) => (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({pressed}) => [
        styles.btn,
        {backgroundColor: disabled ? c.greyLight : color},
        pressed && !disabled && {opacity: 0.85},
        style,
      ]}
    >
      <View style={styles.btnContent}>
        {icon && <PsIcon name={icon} size={20} />}
        <Text style={[styles.btnText, {color: disabled ? c.grey : textColor}]}>{label}</Text>
      </View>
    </Pressable>
  ),
);

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
    shadowOffset: {width: 0, height: 3},
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
