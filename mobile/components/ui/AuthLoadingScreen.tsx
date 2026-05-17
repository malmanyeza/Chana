import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS } from '../../constants/theme';

export function AuthLoadingScreen() {
  const pulse = useRef(new Animated.Value(1)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in
    Animated.timing(fade, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Gentle pulse on the logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fade }]}>
      <LinearGradient
        colors={['#0F0F14', '#1A0A10', '#0F0F14']}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      <Animated.View style={[styles.logoWrap, { transform: [{ scale: pulse }] }]}>
        <LinearGradient
          colors={COLORS.gradients.warm as [string, string]}
          style={styles.logoGradient}
        >
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </LinearGradient>
      </Animated.View>

      <Text style={styles.appName}>Chana</Text>
      <Text style={styles.tagline}>Every connection starts with one.</Text>

      {/* Animated dots */}
      <DotsIndicator />
    </Animated.View>
  );
}

function DotsIndicator() {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver: true }),
          Animated.delay(800 - delay),
        ])
      );

    Animated.parallel([animate(dot1, 0), animate(dot2, 200), animate(dot3, 400)]).start();
  }, []);

  return (
    <View style={styles.dotsRow}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View key={i} style={[styles.dot, { opacity: dot }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orb1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: COLORS.primary,
    opacity: 0.12,
    top: -80,
    right: -60,
  },
  orb2: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: COLORS.accent,
    opacity: 0.1,
    bottom: 100,
    left: -80,
  },
  logoWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  logoGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 58,
    height: 58,
  },
  appName: {
    fontFamily: FONTS.display,
    fontSize: 52,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  tagline: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: 'rgba(255,255,255,0.4)',
    fontStyle: 'italic',
    marginBottom: 48,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
});
