import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { useAppTheme } from '../../hooks/use-theme-color';

const { width, height } = Dimensions.get('window');

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
  currentFilters: {
    distance: number;
    ageRange: [number, number];
    interestedIn: 'men' | 'women' | 'everyone';
  };
}

export function FilterModal({ visible, onClose, onApply, currentFilters }: FilterModalProps) {
  const theme = useAppTheme();
  const [distance, setDistance] = useState(currentFilters.distance);
  const [ageRange, setAgeRange] = useState<[number, number]>(currentFilters.ageRange);
  const [interestedIn, setInterestedIn] = useState(currentFilters.interestedIn);

  const handleApply = () => {
    onApply({
      distance,
      ageRange,
      interestedIn,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: theme.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.text }]}>Filters</Text>
            <TouchableOpacity onPress={handleApply}>
              <Text style={[styles.applyText, { color: theme.primary }]}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {/* Interested In */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Show me</Text>
              <View style={styles.optionsRow}>
                {(['men', 'women', 'everyone'] as const).map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionButton,
                      { backgroundColor: theme.card, borderColor: interestedIn === option ? theme.primary : theme.border }
                    ]}
                    onPress={() => setInterestedIn(option)}
                  >
                    <Text style={[
                      styles.optionText,
                      { color: interestedIn === option ? theme.primary : theme.text }
                    ]}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Distance */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Maximum Distance</Text>
                <Text style={[styles.sectionValue, { color: theme.primary }]}>{distance} km</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={160}
                step={1}
                value={distance}
                onValueChange={setDistance}
                minimumTrackTintColor={theme.primary}
                maximumTrackTintColor={theme.border}
                thumbTintColor={theme.primary}
              />
            </View>

            {/* Age Range */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Age Range</Text>
                <Text style={[styles.sectionValue, { color: theme.primary }]}>{ageRange[0]} - {ageRange[1]}</Text>
              </View>
              <View style={styles.ageSliderContainer}>
                <MultiSlider
                  values={[ageRange[0], ageRange[1]]}
                  sliderLength={width - SPACING.xl * 2}
                  onValuesChange={(values) => setAgeRange([values[0], values[1]])}
                  min={18}
                  max={80}
                  step={1}
                  allowOverlap={false}
                  snapped
                  selectedStyle={{ backgroundColor: theme.primary }}
                  unselectedStyle={{ backgroundColor: theme.border }}
                  trackStyle={{ height: 4 }}
                  markerStyle={{
                    backgroundColor: '#FFF',
                    height: 24,
                    width: 24,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: theme.primary,
                    ...SHADOWS.soft,
                  }}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.resetButton} onPress={() => {
              setDistance(50);
              setMinAge(18);
              setMaxAge(40);
              setInterestedIn('everyone');
            }}>
              <Text style={[styles.resetText, { color: theme.textMuted }]}>Reset all filters</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    height: height * 0.75,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
  },
  closeButton: {
    marginLeft: -8,
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 22,
  },
  applyText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 18,
  },
  scroll: {
    padding: SPACING.xl,
  },
  section: {
    marginBottom: SPACING.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontFamily: FONTS.display,
    fontSize: 18,
  },
  sectionValue: {
    fontFamily: FONTS.bodyBold,
    fontSize: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: SPACING.md,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    alignItems: 'center',
  },
  optionText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  ageSliderContainer: {
    marginTop: SPACING.sm,
  },
  ageLabel: {
    fontFamily: FONTS.body,
    fontSize: 14,
    marginTop: 10,
  },
  resetButton: {
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingBottom: 40,
  },
  resetText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    textDecorationLine: 'underline',
  }
});
