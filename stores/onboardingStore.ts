import { create } from 'zustand';

interface OnboardingData {
  fullName: string;
  birthDate: string;
  gender: string;
  bio: string;
  interests: string[];
  photos: string[];
  preferences: {
    interestedIn: string;
    minAge: number;
    maxAge: number;
    distance: number;
  };
}

interface OnboardingState {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  resetData: () => void;
}

const initialData: OnboardingData = {
  fullName: '',
  birthDate: '',
  gender: '',
  bio: '',
  interests: [],
  photos: [],
  preferences: {
    interestedIn: 'both',
    minAge: 18,
    maxAge: 50,
    distance: 50,
  },
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  data: initialData,
  updateData: (updates) => 
    set((state) => ({ 
      data: { ...state.data, ...updates } 
    })),
  resetData: () => set({ data: initialData }),
}));
