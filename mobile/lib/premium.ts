import { Profile } from '../types';

/**
 * Checks if a user has an active premium subscription.
 * A user is premium if is_premium is true AND premium_until is in the future.
 */
export const isPremiumActive = (profile: Profile | null): boolean => {
  if (!profile) return false;
  if (!profile.is_premium) return false;
  
  // If no expiry date is set, assume they are premium forever (legacy or special accounts)
  if (!profile.premium_until) return true;

  const expiryDate = new Date(profile.premium_until);
  const now = new Date();

  return expiryDate > now;
};
