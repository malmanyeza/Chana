export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  birth_date: string | null;
  gender: string | null;
  bio: string | null;
  interests: string[] | null;
  photos: string[] | null;
  country: string | null;
  preferences: {
    interestedIn: string;
    minAge: number;
    maxAge: number;
    distance: number;
  } | null;
  location_city: string | null;
  latitude: number | null;
  longitude: number | null;
  distance_km?: number | null;
  is_onboarded: boolean;
  is_premium: boolean;
  premium_until?: string;
  swipes_remaining: number;
  last_swipe_reset: string;
  created_at: string;
  updated_at: string;
}

export interface Swipe {
  id: number;
  swiper_id: string;
  swiped_id: string;
  type: 'like' | 'pass' | 'superlike';
  created_at: string;
}

export interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  // Joined fields
  user1?: Profile;
  user2?: Profile;
  otherUser?: Profile;
  lastMessage?: string;
  time?: string;
  unread?: boolean;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface DiscoverProfile {
  id: string;
  name: string;
  age: number;
  photos: string[];
  city: string;
  country?: string;
  distance: string;
  interests: string[];
  isVerified: boolean;
  bio?: string;
  gender?: string;
}
