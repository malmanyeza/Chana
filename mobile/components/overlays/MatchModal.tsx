import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { Profile } from '../../types';

const { width, height } = Dimensions.get('window');

interface MatchModalProps {
  visible: boolean;
  myProfile: Profile;
  matchedProfile: Profile;
  matchId: string;
  onClose: () => void;
}

export function MatchModal({ visible, myProfile, matchedProfile, matchId, onClose }: MatchModalProps) {
  const router = useRouter();
  
  // Use useRef to prevent values from being recreated on every render
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset values before starting
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleMessage = () => {
    onClose();
    router.push(`/(tabs)/messages/${matchId}`);
  };

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={styles.overlay}>
        <LinearGradient
          colors={['rgba(15,15,20,0.95)', 'rgba(255,77,109,0.3)', 'rgba(15,15,20,0.95)']}
          style={StyleSheet.absoluteFillObject}
        />

        <Animated.View style={[styles.content, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
          {/* Title */}
          <Text style={styles.itsAMatch}>It's a Match!</Text>
          <Text style={styles.subtitle}>
            You and {matchedProfile.full_name} liked each other
          </Text>

          {/* Photos */}
          <View style={styles.photosRow}>
            <View style={[styles.photoWrapper, styles.photoLeft]}>
              <Image
                source={{ uri: myProfile.avatar_url || (myProfile.photos?.[0] || 'https://via.placeholder.com/300x400') }}
                style={styles.photo}
                contentFit="contain"
              />
              <LinearGradient
                colors={['transparent', 'rgba(255,77,109,0.5)']}
                style={StyleSheet.absoluteFillObject}
              />
            </View>

            <View style={styles.heartBadge}>
              <Text style={styles.heartEmoji}>❤️</Text>
            </View>

            <View style={[styles.photoWrapper, styles.photoRight]}>
              <Image
                source={{ uri: matchedProfile.avatar_url || (matchedProfile.photos?.[0] || 'https://via.placeholder.com/300x400') }}
                style={styles.photo}
                contentFit="contain"
              />
              <LinearGradient
                colors={['transparent', 'rgba(255,77,109,0.5)']}
                style={StyleSheet.absoluteFillObject}
              />
            </View>
          </View>

          {/* Actions */}
          <TouchableOpacity style={styles.messageButton} onPress={handleMessage}>
            <LinearGradient
              colors={COLORS.gradients.warm as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.messageGradient}
            >
              <Text style={styles.messageButtonText}>Send a Message</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.keepSwipingButton} onPress={onClose}>
            <Text style={styles.keepSwipingText}>Keep Swiping</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const PHOTO_SIZE = width * 0.38;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    width: '100%',
  },
  itsAMatch: {
    fontFamily: FONTS.display,
    fontSize: 52,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 18,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: SPACING.xxl,
  },
  photosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  photoWrapper: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE * 1.35,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  photoLeft: {
    transform: [{ rotate: '-6deg' }],
    marginRight: -20,
    zIndex: 1,
  },
  photoRight: {
    transform: [{ rotate: '6deg' }],
    marginLeft: -20,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  heartBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    shadowColor: '#FF4D6D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  heartEmoji: {
    fontSize: 24,
  },
  messageButton: {
    width: '100%',
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  messageGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  messageButtonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 18,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  keepSwipingButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
  keepSwipingText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
  },
});
