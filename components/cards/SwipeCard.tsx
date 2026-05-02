import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  Dimensions, 
  TouchableOpacity 
} from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { useAppTheme } from '../../hooks/use-theme-color';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width - SPACING.lg * 2;
const CARD_HEIGHT = height * 0.7;
const SWIPE_THRESHOLD = width * 0.4;

interface Profile {
  id: string;
  name: string;
  age: number;
  photos: string[];
  city: string;
  distance: string;
  interests: string[];
  isVerified?: boolean;
}

interface SwipeCardProps {
  profile: Profile;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  isTop: boolean;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({ 
  profile, 
  onSwipeLeft, 
  onSwipeRight,
  isTop 
}) => {
  const theme = useAppTheme();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-width / 2, 0, width / 2],
      [-10, 0, 10],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` }
      ]
    };
  });

  const likeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD / 2], [0, 1], Extrapolate.CLAMP)
  }));

  const nopeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD / 2, 0], [1, 0], Extrapolate.CLAMP)
  }));

  const onGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    if (!isTop) return;
    translateX.value = event.nativeEvent.translationX;
    translateY.value = event.nativeEvent.translationY;
  };

  const onHandlerStateChange = (event: any) => {
    if (!isTop) return;
    if (event.nativeEvent.state === 5) { // END
      if (Math.abs(translateX.value) > SWIPE_THRESHOLD) {
        if (translateX.value > 0) {
          translateX.value = withSpring(width * 1.5, {}, () => onSwipeRight());
        } else {
          translateX.value = withSpring(-width * 1.5, {}, () => onSwipeLeft());
        }
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    }
  };

  return (
    <PanGestureHandler
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
    >
      <Animated.View style={[styles.card, { backgroundColor: theme.card }, animatedStyle]}>
        <Image source={{ uri: profile.photos[0] }} style={styles.image} />
        
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.gradient}
        />

        {/* Swipe Indicators */}
        <Animated.View style={[styles.indicator, styles.likeIndicator, { borderColor: theme.success }, likeOpacity]}>
          <Text style={[styles.indicatorText, { color: theme.success }]}>LIKE</Text>
        </Animated.View>
        <Animated.View style={[styles.indicator, styles.nopeIndicator, { borderColor: theme.error }, nopeOpacity]}>
          <Text style={[styles.indicatorText, { color: theme.error }]}>NOPE</Text>
        </Animated.View>

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{profile.name}, {profile.age}</Text>
            {profile.isVerified && (
              <Ionicons name="checkmark-circle" size={20} color={theme.success} style={styles.verifyIcon} />
            )}
          </View>
          
          <Text style={styles.location}>
            <Ionicons name="location" size={14} color="#FFF" /> {profile.city} · {profile.distance}
          </Text>

          <View style={styles.interestsRow}>
            {profile.interests.slice(0, 3).map((interest, idx) => (
              <View key={idx} style={styles.interestTag}>
                <Text style={styles.interestText}>{interest}</Text>
              </View>
            ))}
          </View>
        </View>
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    position: 'absolute',
    ...SHADOWS.soft,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  info: {
    position: 'absolute',
    bottom: SPACING.lg,
    left: SPACING.lg,
    right: SPACING.lg,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontFamily: FONTS.display,
    fontSize: 32,
    color: '#FFFFFF',
  },
  verifyIcon: {
    marginLeft: 8,
  },
  location: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: SPACING.md,
  },
  interestsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  interestTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: BORDER_RADIUS.full,
  },
  interestText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  indicator: {
    position: 'absolute',
    top: 40,
    borderWidth: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 10,
  },
  likeIndicator: {
    left: 30,
    transform: [{ rotate: '-20deg' }],
  },
  nopeIndicator: {
    right: 30,
    transform: [{ rotate: '20deg' }],
  },
  indicatorText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 32,
    fontWeight: '900',
  }
});
