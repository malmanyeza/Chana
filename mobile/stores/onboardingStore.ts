import { create } from 'zustand';

interface OnboardingData {
  fullName: string;
  country: string;
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
  locationCity: string;
}

interface OnboardingState {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  resetData: () => void;
}

const initialData: OnboardingData = {
  fullName: '',
  country: '',
  birthDate: '',
  gender: '',
  bio: '',
  interests: [],
  photos: [],
  preferences: {
    interestedIn: '',
    minAge: 18,
    maxAge: 50,
    distance: 50,
  },
  locationCity: '',
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  data: initialData,
  updateData: (updates) => 
    set((state) => ({ 
      data: { ...state.data, ...updates } 
    })),
  resetData: () => set({ data: initialData }),
}));
