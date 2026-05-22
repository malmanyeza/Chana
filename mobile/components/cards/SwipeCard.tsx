import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity 
} from 'react-native';
import { Image } from 'expo-image';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  interpolate,
  Extrapolate,
  runOnJS
} from 'react-native-reanimated';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { useAppTheme } from '../../hooks/use-theme-color';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width - SPACING.lg * 2;
const CARD_HEIGHT = height * 0.62;
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
  hasSwipes?: boolean;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({ 
  profile, 
  onSwipeLeft, 
  onSwipeRight,
  isTop,
  hasSwipes = true
}) => {
  const theme = useAppTheme();
  const [photoIndex, setPhotoIndex] = useState(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const nextPhoto = () => {
    if (photoIndex < profile.photos.length - 1) {
      setPhotoIndex(prev => prev + 1);
    }
  };

  const prevPhoto = () => {
    if (photoIndex > 0) {
      setPhotoIndex(prev => prev - 1);
    }
  };

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

  const indicatorOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD], [1, 0, 1], Extrapolate.CLAMP)
  }));

  const likeScale = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0.5, 1], Extrapolate.CLAMP) }],
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD / 2], [0, 1], Extrapolate.CLAMP)
  }));

  const nopeScale = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0.5], Extrapolate.CLAMP) }],
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
          if (!hasSwipes) {
            // Spring back to center and trigger check
            translateY.value = withSpring(0);
            translateX.value = withSpring(0, {}, () => {
              'worklet';
              runOnJS(onSwipeRight)();
            });
          } else {
            translateX.value = withSpring(width * 1.5, {}, () => {
              'worklet';
              runOnJS(onSwipeRight)();
            });
          }
        } else {
          translateX.value = withSpring(-width * 1.5, {}, () => {
            'worklet';
            runOnJS(onSwipeLeft)();
          });
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
        <Image 
          key={`${profile.id}-${photoIndex}`}
          source={{ uri: profile.photos[photoIndex] || profile.photos[0] }} 
          style={styles.image} 
          contentFit="cover"
          placeholder="https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=400&q=40" // Generic profile placeholder
        />
        
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.75)']}
          style={styles.gradient}
        />

        {/* Photo Progress */}
        <View style={styles.pagination}>
          {profile.photos.length > 1 && profile.photos.map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.paginationBar, 
                { backgroundColor: i === photoIndex ? '#FFFFFF' : 'rgba(255,255,255,0.3)' }
              ]} 
            />
          ))}
        </View>

        {/* Tap areas for photo cycling */}
        <View style={styles.tapAreaContainer}>
          <TouchableOpacity 
            style={styles.tapArea} 
            onPress={prevPhoto} 
            activeOpacity={1}
          />
          <TouchableOpacity 
            style={styles.tapArea} 
            onPress={nextPhoto} 
            activeOpacity={1}
          />
        </View>

        {/* Swipe Indicators */}
        <Animated.View style={[styles.indicator, styles.likeIndicator, likeScale]}>
          <View style={[styles.indicatorInner, { borderColor: theme.success }]}>
            <Text style={[styles.indicatorText, { color: theme.success }]}>LIKE</Text>
          </View>
        </Animated.View>
        
        <Animated.View style={[styles.indicator, styles.nopeIndicator, nopeScale]}>
          <View style={[styles.indicatorInner, { borderColor: theme.error }]}>
            <Text style={[styles.indicatorText, { color: theme.error }]}>NOPE</Text>
          </View>
        </Animated.View>

        <View style={styles.info}>
          <View style={styles.topInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>
                {profile.name.split(' ')[0]}, {profile.age} {profile.country ? profile.country : ''}
              </Text>
              {profile.isVerified && (
                <View style={styles.verifyBadge}>
                  <Ionicons name="checkmark-sharp" size={12} color="#FFF" />
                </View>
              )}
            </View>
            
            <View style={styles.locationPill}>
              <Ionicons name="location" size={14} color={theme.primary} />
              <Text style={styles.locationText}>
                {profile.city}{profile.distance ? ` • ${profile.distance}` : ''}
              </Text>
            </View>
          </View>

          {profile.bio && (
            <Text style={styles.bio} numberOfLines={3}>
              {profile.bio}
            </Text>
          )}

          <View style={styles.interestsRow}>
            {profile.interests.slice(0, 3).map((interest, idx) => (
              <View key={idx} style={[styles.interestTag, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
                <Text style={styles.interestText}>{interest}</Text>
              </View>
            ))}
            {profile.interests.length > 3 && (
              <Text style={styles.moreInterests}>+{profile.interests.length - 3}</Text>
            )}
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
    borderRadius: 24,
    overflow: 'hidden',
    position: 'absolute',
    ...SHADOWS.soft,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '45%',
  },
  pagination: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    gap: 4,
  },
  paginationBar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  tapAreaContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    zIndex: 10,
  },
  tapArea: {
    flex: 1,
  },
  info: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  topInfo: {
    marginBottom: SPACING.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  name: {
    fontFamily: FONTS.display,
    fontSize: 28,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  verifyBadge: {
    backgroundColor: '#1DA1F2',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  bio: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: SPACING.md,
    lineHeight: 18,
  },
  interestsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  interestTag: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  interestText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  moreInterests: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginLeft: 2,
  },
  indicator: {
    position: 'absolute',
    top: 50,
    zIndex: 100,
  },
  likeIndicator: {
    left: 20,
    transform: [{ rotate: '-15deg' }],
  },
  nopeIndicator: {
    right: 20,
    transform: [{ rotate: '15deg' }],
  },
  indicatorInner: {
    borderWidth: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  indicatorText: {
    fontFamily: FONTS.display,
    fontSize: 36,
    fontWeight: 'bold',
  }
});
