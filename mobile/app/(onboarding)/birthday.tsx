import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { FONTS, SPACING } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Ionicons } from '@expo/vector-icons';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useAppTheme } from '../../hooks/use-theme-color';

export default function BirthdayOnboarding() {
  const router = useRouter();
  const theme = useAppTheme();
  const { data, updateData } = useOnboardingStore();
  const [showDatePicker, setShowDatePicker] = React.useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      updateData({ birthDate: selectedDate.toISOString().split('T')[0] });
    }
  };

  const isComplete = !!data.birthDate;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: SPACING.md }}>
          <ProgressBar progress={0.28} label="Step 2 of 7" />
        </View>
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>When's your birthday?</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Your age will be visible to others.
        </Text>

        <TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
          <View pointerEvents="none">
            <Input
              label="Date of Birth"
              placeholder="Select your date of birth"
              value={data.birthDate}
              editable={false}
              icon="calendar-outline"
            />
          </View>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={data.birthDate ? new Date(data.birthDate) : new Date(2000, 0, 1)}
            mode="date"
            display="spinner"
            maximumDate={new Date()}
            onChange={handleDateChange}
          />
        )}
      </View>

      <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
        <Button
          title="Continue"
          disabled={!isComplete}
          onPress={() => router.push('/(onboarding)/gender')}
        />
      </View>
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
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    flex: 1,
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
  footer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
    borderTopWidth: 1,
  },
});
