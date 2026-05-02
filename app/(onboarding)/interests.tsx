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
    } else {
      if (selected.length < 10) {
        updateData({ interests: [...selected, id] });
      }
    }
  };

  const isComplete = data.interests.length >= 3;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <ProgressBar progress={0.5} label="Step 2 of 4" />
      </View>

      <View style={styles.main}>
        <Text style={[styles.title, { color: theme.text }]}>What are you into?</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>Pick at least 3 things you love to help us find better matches.</Text>

        <ScrollView contentContainerStyle={styles.grid}>
          {INTERESTS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.tag,
                { backgroundColor: theme.card, borderColor: theme.border },
                data.interests.includes(item.id) && [styles.tagSelected, { borderColor: theme.primary, backgroundColor: theme.primary }]
              ]}
              onPress={() => toggleInterest(item.id)}
            >
              <Text style={[
                styles.tagText,
                { color: theme.textMuted },
                data.interests.includes(item.id) && styles.tagTextSelected
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <Text style={[styles.counter, { color: theme.textMuted }]}>{data.interests.length}/10 selected</Text>
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
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  main: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 16,
    marginBottom: SPACING.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: SPACING.xl,
  },
  tag: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  tagSelected: {
    // Colors handled dynamically
  },
  tagText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
  },
  tagTextSelected: {
    color: '#FFFFFF',
  },
  footer: {
    padding: SPACING.lg,
    borderTopWidth: 1,
  },
  counter: {
    fontFamily: FONTS.body,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
});
