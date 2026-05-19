import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { useAppTheme } from '../../hooks/use-theme-color';
import { useColorScheme } from 'react-native';
import { FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';

const { width } = Dimensions.get('window');

interface AlertNotification {
  id: string;
  type: 'signup' | 'payment';
  message: string;
}

export default function AdminDashboard() {
  const theme = useAppTheme();
  const activeTheme = useColorScheme() ?? 'dark';
  const { signOut } = useAuthStore();
  
  // Dashboard Metrics
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    paidUsers: 0,
    totalMatches: 0,
    totalLikes: 0,
    activeUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Custom Banner Notification State
  const [alert, setAlert] = useState<AlertNotification | null>(null);
  const slideAnim = useRef(new Animated.Value(-150)).current;

  const fetchMetrics = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      
      const { data: stats, error } = await supabase.rpc('get_dashboard_stats');
      if (error) throw error;
      
      if (stats) {
        const profiles = stats.profiles || [];
        const matches = stats.matches || [];
        const swipes = stats.swipes || [];
        
        setMetrics({
          totalUsers: profiles.length,
          paidUsers: profiles.filter((p: any) => p.is_premium).length,
          totalMatches: matches.length,
          totalLikes: swipes.length,
          activeUsers: profiles.length,
        });
      }
    } catch (error) {
      console.error('Error fetching admin metrics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics();

    // Subscribe to realtime database updates for live mobile banners
    const channel = supabase
      .channel('mobile-admin-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          console.log('Admin realtime profile change received:', payload);
          const { eventType, new: newProfile, old: oldProfile } = payload;

          if (eventType === 'INSERT') {
            const name = newProfile?.full_name || 'A new member';
            triggerBanner('signup', `🎉 New User Signup: ${name} joined Chana!`);
            // Automatically refresh stats silently
            fetchMetrics(true);
          } else if (eventType === 'UPDATE') {
            const wasPremium = oldProfile ? !!oldProfile.is_premium : false;
            const isPremium = newProfile ? !!newProfile.is_premium : false;

            if (!wasPremium && isPremium) {
              const name = newProfile?.full_name || 'A subscriber';
              triggerBanner('payment', `💸 Cash In! ${name} upgraded to Chana Gold!`);
              // Automatically refresh stats silently
              fetchMetrics(true);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const triggerBanner = (type: 'signup' | 'payment', message: string) => {
    setAlert({ id: Math.random().toString(), type, message });
    
    // Slide Down
    Animated.spring(slideAnim, {
      toValue: 20,
      useNativeDriver: true,
      tension: 40,
      friction: 8,
    }).start();

    // Slide Up after 5 seconds
    setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: -150,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        setAlert(null);
      });
    }, 5000);
  };

  const handleSignOut = () => {
    signOut();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={activeTheme === 'light' ? 'dark-content' : 'light-content'} />

      {/* Floating In-App Banner Notification */}
      {alert && (
        <Animated.View style={[styles.bannerContainer, { transform: [{ translateY: slideAnim }] }]}>
          <BlurView intensity={90} tint={activeTheme} style={styles.bannerBlur}>
            <View style={[styles.bannerSide, { backgroundColor: alert.type === 'payment' ? '#F5C400' : '#6C63FF' }]} />
            <View style={styles.bannerContent}>
              <View style={styles.bannerHeader}>
                <Ionicons 
                  name={alert.type === 'payment' ? 'sparkles' : 'person-add'} 
                  size={16} 
                  color={alert.type === 'payment' ? '#F5C400' : '#6C63FF'} 
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.bannerTitle, { color: theme.text }]}>
                  {alert.type === 'payment' ? 'Gold Upgrade 💸' : 'New Chana Member 🎉'}
                </Text>
              </View>
              <Text style={[styles.bannerText, { color: theme.text }]}>{alert.message}</Text>
            </View>
          </BlurView>
        </Animated.View>
      )}

      {/* Header */}
      <View style={[styles.header, { borderColor: theme.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Admin Console</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>Chana HQ Live Feed</Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.signOutButton, { backgroundColor: 'rgba(255, 77, 109, 0.12)' }]}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color="#FF4D6D" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loaderText, { color: theme.textMuted }]}>Syncing with live database...</Text>
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Hero Card */}
          <LinearGradient
            colors={activeTheme === 'light' 
              ? ['#FFEBF0', '#FFF5F7'] 
              : ['#2E1018', '#1A0A10']}
            style={[styles.heroCard, { borderColor: activeTheme === 'light' ? '#FFD6E0' : '#4E1B28' }]}
          >
            <View style={styles.heroRow}>
              <View>
                <Text style={[styles.heroTitle, { color: theme.text }]}>Realtime System Stats</Text>
                <Text style={[styles.heroSubtitle, { color: theme.textMuted }]}>Currently monitoring live streams</Text>
              </View>
              <TouchableOpacity 
                style={[styles.refreshCircle, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => fetchMetrics()}
                disabled={refreshing}
              >
                {refreshing ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <Ionicons name="refresh" size={18} color={theme.primary} />
                )}
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Grid Metrics */}
          <View style={styles.grid}>
            {/* Total Users */}
            <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={[styles.statIconContainer, { backgroundColor: 'rgba(108, 99, 255, 0.1)' }]}>
                <Ionicons name="people" size={22} color="#6C63FF" />
              </View>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Total Users</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>{metrics.totalUsers}</Text>
            </View>

            {/* Paid Users */}
            <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={[styles.statIconContainer, { backgroundColor: 'rgba(245, 196, 0, 0.1)' }]}>
                <Ionicons name="crown" size={22} color="#F5C400" />
              </View>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Chana Gold</Text>
              <Text style={[styles.statValue, { color: '#F5C400' }]}>{metrics.paidUsers}</Text>
            </View>

            {/* Matches */}
            <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255, 77, 109, 0.1)' }]}>
                <Ionicons name="heart" size={22} color="#FF4D6D" />
              </View>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Matches</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>{metrics.totalMatches}</Text>
            </View>

            {/* Likes */}
            <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255, 154, 60, 0.1)' }]}>
                <Ionicons name="flame" size={22} color="#FF9A3C" />
              </View>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Total Likes</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>{metrics.totalLikes}</Text>
            </View>
          </View>

          {/* Connected Live Streams Log */}
          <View style={[styles.livePanel, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.livePanelHeader}>
              <View style={styles.pulseContainer}>
                <View style={styles.pulseInner} />
              </View>
              <Text style={[styles.livePanelTitle, { color: theme.text }]}>Live Activity Monitor</Text>
            </View>
            <Text style={[styles.livePanelText, { color: theme.textMuted }]}>
              Waiting for new platform updates. The mobile app will display drop-down alert notifications in real-time as users register or pay subscriptions. Keep this screen open on your device!
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontFamily: FONTS.display,
    fontSize: 24,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 12.5,
    marginTop: 2,
  },
  signOutButton: {
    width: 42,
    height: 42,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  loaderText: {
    fontFamily: FONTS.body,
    fontSize: 14,
  },
  scroll: {
    padding: SPACING.lg,
    gap: SPACING.lg,
  },
  heroCard: {
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.lg,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTitle: {
    fontFamily: FONTS.display,
    fontSize: 20,
    fontWeight: 'bold',
  },
  heroSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 13,
    marginTop: 4,
  },
  refreshCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  statCard: {
    width: (width - SPACING.lg * 2 - SPACING.md) / 2,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: 8,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: FONTS.body,
    fontSize: 13,
  },
  statValue: {
    fontFamily: FONTS.bodyBold,
    fontSize: 26,
    fontWeight: 'bold',
  },
  livePanel: {
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  livePanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  pulseContainer: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00E676',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseInner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0, 230, 118, 0.25)',
    position: 'absolute',
  },
  livePanelTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14.5,
    fontWeight: '700',
  },
  livePanelText: {
    fontFamily: FONTS.body,
    fontSize: 13.5,
    lineHeight: 20,
  },
  bannerContainer: {
    position: 'absolute',
    top: 50,
    left: SPACING.lg,
    right: SPACING.lg,
    zIndex: 9999,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  bannerBlur: {
    flexDirection: 'row',
    padding: SPACING.md,
  },
  bannerSide: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginRight: SPACING.md,
  },
  bannerContent: {
    flex: 1,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bannerTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    fontWeight: '700',
  },
  bannerText: {
    fontFamily: FONTS.body,
    fontSize: 13,
  },
});
