import { supabase } from '../lib/supabase';

export interface UserStats {
  id: string;
  fullName: string;
  avatarUrl: string;
  age: number | null;
  gender: string;
  location: string;
  totalLikesReceived: number;
  pendingLikes: number;
  matches: number;
  joinedAt: string;
}

export interface DashboardMetrics {
  totalUsers: number;
  totalMatches: number;
  totalLikes: number;
  activeUsers: number;
}

export const fetchDashboardData = async () => {
  // Call the secure RPC function to bypass RLS and get all stats at once
  const { data: stats, error } = await supabase.rpc('get_dashboard_stats');

  if (error) throw error;
  if (!stats) throw new Error('No data returned from RPC');

  const profiles = stats.profiles || [];
  const matches = stats.matches || [];
  const swipes = stats.swipes || [];

  // Process User Stats
  const users: UserStats[] = (profiles || []).map(profile => {
    // Calculate Age
    let age = null;
    if (profile.birth_date) {
      const birthYear = new Date(profile.birth_date).getFullYear();
      const currentYear = new Date().getFullYear();
      age = currentYear - birthYear;
    }

    // Avatar fallback to first photo
    const avatar = profile.avatar_url || (profile.photos && profile.photos[0]) || '';

    // Count Matches
    const userMatches = (matches || []).filter(
      (m: any) => m.user1_id === profile.id || m.user2_id === profile.id
    ).length;

    // People who swiped right on this profile (Total Historic Likes)
    const receivedLikes = (swipes || []).filter(
      (s: any) => s.swiped_id === profile.id && (s.type === 'like' || s.type === 'superlike')
    );
    const totalLikesReceived = receivedLikes.length;

    // IDs of people this profile has swiped on (left or right)
    const swipedOnIds = new Set(
      (swipes || [])
        .filter((s: any) => s.swiper_id === profile.id)
        .map((s: any) => s.swiped_id)
    );

    // Pending Likes = received likes from people this profile hasn't swiped on yet
    const pendingLikes = receivedLikes.filter((s: any) => !swipedOnIds.has(s.swiper_id)).length;

    return {
      id: profile.id,
      fullName: profile.full_name || 'Anonymous',
      avatarUrl: avatar,
      age,
      gender: profile.gender || 'unspecified',
      location: profile.location_city || 'Unknown',
      totalLikesReceived,
      pendingLikes,
      matches: userMatches,
      joinedAt: profile.created_at || new Date().toISOString()
    };
  });

  // Sort by newest joined
  users.sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime());

  // Calculate Metrics
  const metrics: DashboardMetrics = {
    totalUsers: users.length,
    totalMatches: matches?.length || 0,
    totalLikes: swipes?.length || 0,
    activeUsers: users.length // Simplify for now
  };

  return { users, metrics };
};
