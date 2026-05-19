import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { useAppTheme } from '../../hooks/use-theme-color';

const { width } = Dimensions.get('window');

interface SwipeLimitModalProps {
  visible: boolean;
  onClose: () => void;
  onUnlockPremium: () => void;
  resetAt?: Date | string;
}

export const SwipeLimitModal = ({ visible, onClose, onUnlockPremium, resetAt }: SwipeLimitModalProps) => {
  const theme = useAppTheme();
  const [timeLeft, setTimeLeft] = React.useState('24:00:00');

  React.useEffect(() => {
    if (!visible) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      let target: Date;

      if (resetAt) {
        target = new Date(resetAt);
      } else {
        // Default to midnight tonight
        target = new Date();
        target.setHours(24, 0, 0, 0);
      }

      const diff = target.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft('00:00:00');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      const pad = (num: number) => String(num).padStart(2, '0');
      setTimeLeft(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [visible, resetAt]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
        
        <View style={[styles.alertContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Sparkles Decorative Badge */}
          <View style={styles.premiumBadge}>
            <LinearGradient
              colors={['#FFE066', '#F5C400']}
              style={styles.premiumBadgeGradient}
            >
              <Text style={styles.premiumBadgeText}>✨ GOLD PERK</Text>
            </LinearGradient>
          </View>

          {/* Top Decorative Countdown Pill */}
          <LinearGradient
            colors={['#FF4D6D', '#FF9A3C']}
            style={styles.timerPill}
          >
            <Ionicons name="time" size={26} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.timerPillText}>{timeLeft}</Text>
          </LinearGradient>

          {/* Title & Subtitle */}
          <Text style={[styles.title, { color: theme.text }]}>Unlock Unlimited Swipes</Text>
          
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            You've hit your daily free swiping limit. Upgrade to Chana Gold to get unlimited connections and start matching!
          </Text>

          {/* Perks list */}
          <View style={[styles.perksContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <View style={styles.perkRow}>
              <View style={[styles.perkIconWrap, { backgroundColor: 'rgba(255, 77, 109, 0.12)' }]}>
                <Ionicons name="infinite" size={18} color="#FF4D6D" />
              </View>
              <Text style={[styles.perkText, { color: theme.text }]}>Unlimited Swipes everyday</Text>
            </View>

            <View style={styles.perkRow}>
              <View style={[styles.perkIconWrap, { backgroundColor: 'rgba(255, 154, 60, 0.12)' }]}>
                <Ionicons name="heart" size={18} color="#FF9A3C" />
              </View>
              <Text style={[styles.perkText, { color: theme.text }]}>See who Likes You first</Text>
            </View>

            <View style={styles.perkRow}>
              <View style={[styles.perkIconWrap, { backgroundColor: 'rgba(108, 99, 255, 0.12)' }]}>
                <Ionicons name="options" size={18} color="#6C63FF" />
              </View>
              <Text style={[styles.perkText, { color: theme.text }]}>Advanced Discovery filters</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity 
            activeOpacity={0.85}
            onPress={onUnlockPremium}
            style={styles.primaryButton}
          >
            <LinearGradient
              colors={['#FF4D6D', '#FF9A3C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Ionicons name="rocket" size={18} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryButtonText}>Upgrade to Gold</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={onClose}
            style={styles.secondaryButton}
            activeOpacity={0.7}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.textMuted }]}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  alertContainer: {
    width: width * 0.9,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
    position: 'relative',
  },
  premiumBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#F5C400',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  premiumBadgeGradient: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    color: '#000',
    letterSpacing: 0.5,
  },
  timerPill: {
    minWidth: 170,
    height: 64,
    borderRadius: 32,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
    shadowColor: '#FF4D6D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  timerPillText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 22,
    color: '#FFF',
    letterSpacing: 1.2,
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 23,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: SPACING.lg,
    paddingHorizontal: 6,
  },
  perksContainer: {
    width: '100%',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  perkIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  perkText: {
    fontFamily: FONTS.body,
    fontSize: 13.5,
    fontWeight: '500',
  },
  primaryButton: {
    width: '100%',
    height: 52,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
    shadowColor: '#FF4D6D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  gradientButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: FONTS.bodyBold,
    color: '#FFF',
    fontSize: 16,
  },
  secondaryButton: {
    width: '100%',
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14.5,
  },
});
