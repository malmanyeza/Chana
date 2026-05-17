import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { INTERESTS } from '../../constants/interests';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Ionicons } from '@expo/vector-icons';
import { useOnboardingStore } from '../../stores/onboardingStore';

import { useAppTheme } from '../../hooks/use-theme-color';

export default function InterestsOnboarding() {
  const router = useRouter();
  const theme = useAppTheme();
  const { data, updateData } = useOnboardingStore();

  const toggleInterest = (id: string) => {
    const selected = data.interests;
    if (selected.includes(id)) {
      updateData({ interests: selected.filter(s => s !== id) });
    } else if (selected.length < 10) {
      updateData({ interests: [...selected, id] });
    }
  };

  const isComplete = data.interests.length >= 3;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: SPACING.md }}>
          <ProgressBar progress={0.71} label="Step 5 of 7" />
        </View>
      </View>

      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>What are you into?</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Pick at least 3 — we'll use these to find your best matches.
        </Text>

        <View style={[styles.countBadge, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.countText, { color: isComplete ? theme.primary : theme.textMuted }]}>
            {data.interests.length}/10
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {INTERESTS.map((item) => {
          const selected = data.interests.includes(item.id);
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.tag,
                { 
                  backgroundColor: selected ? theme.primary : theme.card, 
                  borderColor: selected ? theme.primary : theme.border 
                },
              ]}
              onPress={() => toggleInterest(item.id)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.tagText,
                { color: selected ? '#FFFFFF' : theme.text }
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
        <View style={{ height: SPACING.xl }} />
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
        <Button
          title="Continue"
          disabled={!isComplete}
          onPress={() => router.push('/(onboarding)/photos')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 34,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 16,
    marginBottom: SPACING.md,
  },
  countBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  countText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: SPACING.lg,
  },
  tag: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  tagText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
  },
  footer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
    borderTopWidth: 1,
  },
});
