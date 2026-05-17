import React from 'react';
import { 
  TouchableOpacity, 
  View, 
  StyleSheet, 
  Dimensions 
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, BORDER_RADIUS } from '../../constants/theme';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48 - 16) / 2;

interface PhotoPickerProps {
  uri?: string;
  onPick: (uri: string) => void;
  onRemove: () => void;
  isMain?: boolean;
}

export const PhotoPicker: React.FC<PhotoPickerProps> = ({ uri, onPick, onRemove, isMain }) => {
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled) {
      onPick(result.assets[0].uri);
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.container, isMain && styles.mainContainer]} 
      onPress={uri ? undefined : pickImage}
      activeOpacity={0.8}
    >
      {uri ? (
        <Image 
          source={{ uri }} 
          style={styles.image} 
          contentFit="contain"
          transition={200}
        />
      ) : (
        <View style={styles.placeholder}>
          <Ionicons name="add" size={32} color={COLORS.textMutedDark} />
        </View>
      )}
      {uri && (
        <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
          <Ionicons name="close-circle" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: COLUMN_WIDTH,
    height: COLUMN_WIDTH * 1.25,
    backgroundColor: '#1A1A24',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  mainContainer: {
    borderColor: COLORS.primary,
    borderStyle: 'solid',
  },
  imageContainer: {
    flex: 1,
  },
  image: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
});
