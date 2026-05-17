import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { KeyboardAvoidingWrapper } from '../../components/ui/KeyboardAvoidingWrapper';
import { Ionicons } from '@expo/vector-icons';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useAppTheme } from '../../hooks/use-theme-color';
import { COUNTRIES } from '../../constants/countries';

export default function CountryOnboarding() {
  const router = useRouter();
  const theme = useAppTheme();
  const { data, updateData } = useOnboardingStore();
  const [searchQuery, setSearchQuery] = useState('');

  const isComplete = !!data.country;

  const filteredCountries = useMemo(() => {
    return COUNTRIES.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleSelect = (emoji: string) => {
    updateData({ country: emoji });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: SPACING.md }}>
            <ProgressBar progress={0.28} label="Step 2 of 8" />
          </View>
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.text }]}>Where are you from?</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Your national flag will appear on your profile.
          </Text>

          <Input
            placeholder="Search for a country..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            icon="search-outline"
          />

          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.name}
            style={styles.list}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isSelected = data.country === item.emoji;
              return (
                <TouchableOpacity
                  style={[
                    styles.countryItem,
                    { backgroundColor: theme.card, borderColor: theme.border },
                    isSelected && { borderColor: theme.primary, backgroundColor: `${theme.primary}10` }
                  ]}
                  onPress={() => handleSelect(item.emoji)}
                >
                  <View style={styles.countryInfo}>
                    <Text style={styles.emoji}>{item.emoji}</Text>
                    <Text style={[styles.countryName, { color: theme.text }]}>
                      {item.name}
                    </Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
                  )}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                No countries found.
              </Text>
            }
          />
        </View>
        
        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <Button
            title="Continue"
            disabled={!isComplete}
            onPress={() => router.push('/(onboarding)/birthday')}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
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
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 34,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 16,
    marginBottom: SPACING.xl,
  },
  list: {
    marginTop: SPACING.md,
    flex: 1,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  countryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  countryName: {
    fontFamily: FONTS.bodyBold,
    fontSize: 16,
  },
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
  footer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
    borderTopWidth: 1,
  },
});
