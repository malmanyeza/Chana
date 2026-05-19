import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Share
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { useAppTheme } from '../../hooks/use-theme-color';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import * as WebBrowser from 'expo-web-browser';

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PremiumModalProps {
  visible: boolean;
  onClose: () => void;
  feature?: 'swipes' | 'likes' | 'filters';
}

export const PremiumModal = ({ visible, onClose, feature = 'swipes' }: PremiumModalProps) => {
  const theme = useAppTheme();
  const { profile } = useAuthStore();
  const [selectedPlan, setSelectedPlan] = React.useState<'weekly' | 'monthly'>('monthly');
  const [paymentMethod, setPaymentMethod] = React.useState<'ecocash' | 'card'>('ecocash');
  const [phone, setPhone] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [isPolling, setIsPolling] = React.useState(false);
  const scrollRef = React.useRef<ScrollView>(null);

  React.useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
    return () => showSubscription.remove();
  }, []);

  const getTitle = () => {
    switch (feature) {
      case 'swipes': return 'Unlimited Swipes';
      case 'likes': return 'See Your Fans';
      default: return 'Chana Gold';
    }
  };

  const getSubtitle = () => {
    const firstName = profile?.full_name?.split(' ')[0] || 'there';
    return `Find your soulmate today, ${firstName}.`;
  };

  const features = [
    { icon: 'infinite', label: 'Unlimited Swipes' },
    { icon: 'eye', label: 'See Who Likes You' },
    { icon: 'megaphone-outline', label: 'No Advertisements' },
  ];

  const [plans, setPlans] = React.useState<any[]>([]);

  React.useEffect(() => {
    // Fetch dynamic pricing plans from database
    const fetchPlans = async () => {
      const { data } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('active', true)
        .order('price', { ascending: true });
      
      if (data && data.length > 0) {
        setPlans(data);
        setSelectedPlan(data[0].id);
      } else {
        // Fallback in case database is empty
        setPlans([
          { id: 'weekly', title: 'Weekly', price: 1.00, period: 'week' },
          { id: 'monthly', title: 'Monthly', price: 3.00, period: 'month', is_popular: true },
        ]);
      }
    };
    fetchPlans();
  }, []);

  const handleInviteFriend = async () => {
    try {
      const result = await Share.share({
        message: `Hey! I'm using Chana to meet awesome new people. Join me using my invite link and let's discover genuine connections! https://chana.app/invite?ref=${profile?.id || ''}`,
      });

      if (result.action === Share.sharedAction) {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (session && profile) {
          const newRemaining = (profile.swipes_remaining || 0) + 15;
          const { error } = await supabase
            .from('profiles')
            .update({ swipes_remaining: newRemaining })
            .eq('id', session.user.id);

          if (error) throw error;

          Alert.alert(
            'Thank you! 💖',
            'You successfully shared Chana! 15 bonus swipes have been added to your profile.',
            [{ text: 'Start Swiping!', onPress: onClose }]
          );
        }
      }
    } catch (error: any) {
      console.error('Sharing error:', error);
      Alert.alert('Error', 'Unable to process invite. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    if (paymentMethod === 'ecocash' && (!phone || phone.length < 10)) {
      Alert.alert('Invalid Phone', 'Please enter a valid EcoCash phone number.');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not logged in');

      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/create-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': supabase.supabaseAnonKey,
        },
        body: JSON.stringify({ planId: selectedPlan, phone: paymentMethod === 'ecocash' ? phone : undefined, paymentMethod })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const { paynow, subscriptionId } = data;

      // Paynow Initiation
      const initBody = paynow.initFieldOrder.map((k: string) => `${encodeURIComponent(k)}=${encodeURIComponent(paynow.initFields[k])}`).join('&');
      const initResp = await fetch(paynow.initUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: initBody
      });
      const initText = await initResp.text();
      const initParams = new URLSearchParams(initText);

      if (initParams.get('status') !== 'Ok') {
        throw new Error(initParams.get('error') || 'Failed to initiate Paynow transaction.');
      }

      const pollUrl = initParams.get('pollurl') || '';
      if (pollUrl) {
        await supabase
          .from('subscriptions')
          .update({ poll_url: decodeURIComponent(pollUrl) })
          .eq('id', subscriptionId);
      }

      if (paymentMethod === 'ecocash') {
        // EcoCash USSD Push
        const pollUrl = initParams.get('pollurl') || '';
        
        // Sanitize phone: remove any non-digits, and ensure it starts with 07 or 2637
        let cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.startsWith('263')) {
          cleanPhone = '0' + cleanPhone.substring(3);
        }

        const expressFields: Record<string, string> = {
          resulturl: paynow.initFields.resulturl,
          returnurl: paynow.initFields.returnurl,
          reference: paynow.initFields.reference,
          amount: paynow.initFields.amount,
          id: paynow.initFields.id,
          additionalinfo: paynow.initFields.additionalinfo,
          authemail: paynow.initFields.authemail,
          status: 'Message',
          method: 'ecocash',
          phone: cleanPhone,
          pollurl: decodeURIComponent(pollUrl)
        };

        const expressFieldOrder = ['resulturl', 'returnurl', 'reference', 'amount', 'id', 'additionalinfo', 'authemail', 'status', 'method', 'phone', 'pollurl'];

        const signResp = await fetch(`${supabase.supabaseUrl}/functions/v1/sign-paynow`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': supabase.supabaseAnonKey,
          },
          body: JSON.stringify({ fields: expressFields, fieldOrder: expressFieldOrder })
        });

        const { hash } = await signResp.json();
        expressFields.hash = hash;

        const expressBody = [...expressFieldOrder, 'hash'].map((k: string) => `${encodeURIComponent(k)}=${encodeURIComponent(expressFields[k])}`).join('&');
        const expressResp = await fetch(paynow.expressUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: expressBody
        });

        const expressText = await expressResp.text();
        const expressParams = new URLSearchParams(expressText);
        
        if (expressParams.get('status') !== 'Ok') {
          throw new Error(expressParams.get('error') || 'EcoCash USSD push failed.');
        }

        setIsPolling(true);
        startPolling(subscriptionId);
      } else {
        // Visa/Mastercard Standard Checkout
        const browserUrl = initParams.get('browserurl');
        if (!browserUrl) throw new Error('No browser URL returned from Paynow.');

        setIsPolling(true);
        startPolling(subscriptionId);
        
        // Open in-app browser
        await WebBrowser.openBrowserAsync(decodeURIComponent(browserUrl));
      }

    } catch (error: any) {
      Alert.alert('Payment Error', error.message);
      setLoading(false);
      setIsPolling(false);
    }
  };

  const startPolling = (subscriptionId: string) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      if (attempts > 20) { // Timeout after 1 minute
        clearInterval(interval);
        setIsPolling(false);
        setLoading(false);
        Alert.alert('Timeout', 'We are still waiting for payment. It will be updated automatically once processed.');
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch(`${supabase.supabaseUrl}/functions/v1/check-subscription`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': supabase.supabaseAnonKey,
          },
          body: JSON.stringify({ subscriptionId })
        });

        const resData = await response.json();
        const status = resData.status;

        if (status === 'paid') {
          clearInterval(interval);
          setIsPolling(false);
          setLoading(false);
          Alert.alert('Success!', 'Welcome to Chana Gold! Your premium features are now unlocked.', [
            { text: 'Great!', onPress: onClose }
          ]);
        } else if (status === 'failed' || status === 'cancelled') {
          clearInterval(interval);
          setIsPolling(false);
          setLoading(false);
          Alert.alert('Payment Failed', resData.error || 'The payment transaction failed or was cancelled.');
        }
      } catch (err) {
        console.log('Polling error:', err);
      }
    }, 3000);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <View style={[styles.container, { backgroundColor: theme.card }]}>
              <TouchableOpacity style={styles.closeButton} onPress={onClose} disabled={loading}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>

              <ScrollView 
                ref={scrollRef}
                bounces={false} 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 1 }}
              >
                <LinearGradient
                  colors={['#1C1C1E', '#000']}
                  style={styles.headerArea}
                >
                  <View style={styles.goldBadge}>
                    <Ionicons name="star" size={12} color="#000" />
                    <Text style={styles.goldBadgeText}>CHANA GOLD</Text>
                  </View>
                  <Text style={styles.headerTitle}>{getTitle()}</Text>
                </LinearGradient>

                <View style={styles.content}>
                  <View style={[styles.promoBox, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.promoTitle, { color: theme.textMuted }]}>
                      {getSubtitle()}
                    </Text>
                  </View>

                  <View style={styles.featureList}>
                    {features.map((item, index) => (
                      <View key={index} style={styles.featureItem}>
                        <View style={styles.checkCircle}>
                          <Ionicons name="checkmark" size={14} color="#000" />
                        </View>
                        <Text style={[styles.featureLabel, { color: theme.text }]}>{item.label}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.plansContainer}>
                    {plans.map((plan) => (
                      <TouchableOpacity
                        key={plan.id}
                        style={[
                          styles.planCard,
                          { borderColor: selectedPlan === plan.id ? '#FFD700' : theme.border },
                          selectedPlan === plan.id && { backgroundColor: 'rgba(255,215,0,0.05)' }
                        ]}
                        onPress={() => setSelectedPlan(plan.id as any)}
                        disabled={loading}
                      >
                        {plan.popular && (
                          <View style={styles.popularBadge}>
                            <Text style={styles.popularText}>BEST VALUE</Text>
                          </View>
                        )}
                        <Text style={[styles.planTitle, { color: theme.text }]}>{plan.title}</Text>
                        <Text style={[styles.planPrice, { color: theme.text }]}>${typeof plan.price === 'number' ? plan.price.toFixed(2) : plan.price}</Text>
                        <Text style={[styles.planPeriod, { color: theme.textMuted }]}>per {plan.period}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.paymentSelector}>
                    <TouchableOpacity 
                      style={[
                        styles.methodBtn, 
                        paymentMethod === 'ecocash' && { borderColor: '#FFD700', backgroundColor: 'rgba(255,215,0,0.1)' }
                      ]}
                      onPress={() => setPaymentMethod('ecocash')}
                      disabled={loading}
                    >
                      <Ionicons name="cash-outline" size={18} color={paymentMethod === 'ecocash' ? '#FFD700' : theme.textMuted} />
                      <Text style={[styles.methodText, { color: paymentMethod === 'ecocash' ? '#FFD700' : theme.textMuted }]}>EcoCash</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[
                        styles.methodBtn, 
                        paymentMethod === 'card' && { borderColor: '#FFD700', backgroundColor: 'rgba(255,215,0,0.1)' }
                      ]}
                      onPress={() => setPaymentMethod('card')}
                      disabled={loading}
                    >
                      <Ionicons name="card-outline" size={18} color={paymentMethod === 'card' ? '#FFD700' : theme.textMuted} />
                      <Text style={[styles.methodText, { color: paymentMethod === 'card' ? '#FFD700' : theme.textMuted }]}>Visa/Card</Text>
                    </TouchableOpacity>
                  </View>

                  {paymentMethod === 'ecocash' && (
                    <View style={styles.inputContainer}>
                      <View style={[styles.inputWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <Ionicons name="cash-outline" size={20} color={theme.textMuted} />
                        <TextInput
                          style={[styles.input, { color: theme.text }]}
                          placeholder="EcoCash Phone Number"
                          placeholderTextColor={theme.textMuted}
                          keyboardType="phone-pad"
                          value={phone}
                          onChangeText={setPhone}
                          disabled={loading}
                          autoFocus={paymentMethod === 'ecocash'}
                        />
                      </View>
                      <Text style={styles.inputHelp}>USSD push will be sent to this number</Text>
                      
                      {/* Sandbox Testing Guide with Tap-to-Autofill */}
                      <View style={[styles.sandboxCard, { backgroundColor: 'rgba(255,193,7,0.06)', borderColor: 'rgba(255,193,7,0.2)' }]}>
                        <View style={styles.sandboxHeader}>
                          <Ionicons name="construct-outline" size={16} color="#FFC107" style={{ marginRight: 6 }} />
                          <Text style={styles.sandboxTitle}>Sandbox Test Numbers (Tap to Auto-fill):</Text>
                        </View>
                        <View style={styles.sandboxGrid}>
                          <TouchableOpacity 
                            style={styles.sandboxBadge}
                            onPress={() => setPhone('0771111111')}
                          >
                            <Text style={styles.sandboxBadgeText}>0771111111</Text>
                            <Text style={styles.sandboxBadgeLabel}>Success</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.sandboxBadge}
                            onPress={() => setPhone('0772222222')}
                          >
                            <Text style={styles.sandboxBadgeText}>0772222222</Text>
                            <Text style={styles.sandboxBadgeLabel}>Delayed</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.sandboxBadge}
                            onPress={() => setPhone('0773333333')}
                          >
                            <Text style={styles.sandboxBadgeText}>0773333333</Text>
                            <Text style={styles.sandboxBadgeLabel}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.sandboxBadge}
                            onPress={() => setPhone('0774444444')}
                          >
                            <Text style={styles.sandboxBadgeText}>0774444444</Text>
                            <Text style={styles.sandboxBadgeLabel}>No Funds</Text>
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.sandboxNote}>* Note: In test mode, your Paynow authemail must match your merchant account email.</Text>
                      </View>
                    </View>
                  )}

                  <TouchableOpacity 
                    style={[styles.upgradeButton, loading && { opacity: 0.7 }]} 
                    activeOpacity={0.8} 
                    onPress={handleUpgrade}
                    disabled={loading}
                  >
                    <LinearGradient
                      colors={['#FFD700', '#FDB931']}
                      style={styles.upgradeGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      {loading ? (
                        <View style={styles.loadingRow}>
                          <ActivityIndicator color="#000" size="small" />
                          <Text style={styles.upgradeText}>{isPolling ? (paymentMethod === 'ecocash' ? 'Awaiting USSD...' : 'Awaiting Card...') : 'Processing...'}</Text>
                        </View>
                      ) : (
                        <Text style={styles.upgradeText}>
                          {paymentMethod === 'ecocash' ? 'Subscribe with EcoCash' : 'Subscribe with Card'}
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <Text style={styles.footerNote}>Recurring billing. Cancel anytime.</Text>

                  {feature === 'swipes' && (
                    <View style={styles.inviteContainer}>
                      <View style={styles.dividerRow}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OR GET FREE SWIPES</Text>
                        <View style={styles.dividerLine} />
                      </View>

                      <TouchableOpacity 
                        style={styles.inviteCard}
                        onPress={handleInviteFriend}
                        activeOpacity={0.8}
                        disabled={loading}
                      >
                        <LinearGradient
                          colors={['rgba(255,90,95,0.08)', 'rgba(255,138,0,0.08)']}
                          style={StyleSheet.absoluteFillObject}
                        />
                        <View style={styles.inviteIconCircle}>
                          <Ionicons name="share-social" size={20} color="#FF5A5F" />
                        </View>
                        <View style={styles.inviteContent}>
                          <Text style={styles.inviteTitle}>Invite a Friend</Text>
                          <Text style={styles.inviteSubtitle}>Share Chana & instantly get 15 free swipes!</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  keyboardView: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  container: {
    width: '100%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    marginTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerArea: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: FONTS.display,
    fontSize: 28,
    color: '#FFF',
  },
  goldBadge: {
    flexDirection: 'row',
    backgroundColor: '#FFD700',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
    alignItems: 'center',
    gap: 4,
  },
  goldBadgeText: {
    color: '#000',
    fontSize: 9,
    fontFamily: FONTS.bodyBold,
    letterSpacing: 1,
  },
  content: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    paddingHorizontal: 20,
  },
  promoBox: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  promoTitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  featureList: {
    width: '100%',
    gap: 12,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12,
    borderRadius: 12,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
  },
  plansContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    width: '100%',
  },
  planCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  popularText: {
    color: '#000',
    fontSize: 8,
    fontFamily: FONTS.bodyBold,
  },
  planTitle: {
    fontFamily: FONTS.body,
    fontSize: 12,
    marginBottom: 4,
  },
  planPrice: {
    fontFamily: FONTS.display,
    fontSize: 20,
  },
  planPeriod: {
    fontSize: 10,
    fontFamily: FONTS.body,
  },
  paymentSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    width: '100%',
  },
  methodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    gap: 8,
  },
  methodText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  input: {
    flex: 1,
    fontFamily: FONTS.bodyBold,
    fontSize: 16,
  },
  inputHelp: {
    fontSize: 11,
    fontFamily: FONTS.body,
    color: '#8E8E93',
    marginTop: 6,
    marginLeft: 4,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  upgradeButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  upgradeGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upgradeText: {
    color: '#000',
    fontFamily: FONTS.bodyBold,
    fontSize: 16,
  },
  footerNote: {
    marginTop: 16,
    fontSize: 12,
    fontFamily: FONTS.body,
    color: '#8E8E93',
  },
  inviteContainer: {
    width: '100%',
    marginTop: 24,
    paddingHorizontal: 4,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dividerText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    color: '#8E8E93',
    letterSpacing: 1.5,
  },
  inviteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    position: 'relative',
    overflow: 'hidden',
    gap: 12,
  },
  inviteIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,90,95,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteContent: {
    flex: 1,
    gap: 2,
  },
  inviteTitle: {
    fontFamily: FONTS.display,
    fontSize: 16,
    color: '#FFF',
  },
  inviteSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: '#8E8E93',
  },
  sandboxCard: {
    marginTop: 14,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  sandboxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sandboxTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: '#FFC107',
  },
  sandboxGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sandboxBadge: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: 'center',
    gap: 2,
  },
  sandboxBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: '#FFF',
  },
  sandboxBadgeLabel: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: '#8E8E93',
  },
  sandboxNote: {
    fontFamily: FONTS.body,
    fontSize: 9,
    color: '#8E8E93',
    lineHeight: 12,
    marginTop: 2,
  }
});
