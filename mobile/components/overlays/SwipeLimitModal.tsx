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
}

export const SwipeLimitModal = ({ visible, onClose, onUnlockPremium }: SwipeLimitModalProps) => {
  const theme = useAppTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
        
        <View style={[styles.alertContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Top Decorative Icon */}
          <LinearGradient
            colors={['#FF4D6D', '#FF85A1']}
            style={styles.iconCircle}
          >
            <Ionicons name="heart-dislike" size={32} color="#FFF" />
          </LinearGradient>

          {/* Title & Subtitle */}
          <Text style={[styles.title, { color: theme.text }]}>Out of Free Swipes</Text>
          
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            You've hit your daily free swiping limit. Upgrade to Chana Premium to get unlimited swipes and find your match today!
          </Text>

          {/* Action Buttons */}
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={onUnlockPremium}
            style={styles.primaryButton}
          >
            <LinearGradient
              colors={['#FF4D6D', '#C9184A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Ionicons name="sparkles" size={16} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.primaryButtonText}>Upgrade to Premium</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={onClose}
            style={styles.secondaryButton}
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  alertContainer: {
    width: width * 0.88,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    shadowColor: '#FF4D6D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.xl,
    paddingHorizontal: 10,
  },
  primaryButton: {
    width: '100%',
    height: 50,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
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
    fontSize: 15,
  },
  secondaryButton: {
    width: '100%',
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
  },
});
